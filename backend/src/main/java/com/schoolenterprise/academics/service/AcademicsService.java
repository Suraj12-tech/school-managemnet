package com.schoolenterprise.academics.service;

import com.schoolenterprise.academics.entity.Department;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.entity.SubjectClassMapping;
import com.schoolenterprise.academics.entity.TimetableEntry;
import com.schoolenterprise.academics.dto.DepartmentDetail;
import com.schoolenterprise.academics.dto.DepartmentRequest;
import com.schoolenterprise.academics.dto.DepartmentSummary;
import com.schoolenterprise.academics.dto.SectionDetailResponse;
import com.schoolenterprise.academics.dto.SubjectClassMappingRequest;
import com.schoolenterprise.academics.dto.SubjectClassMappingView;
import com.schoolenterprise.academics.dto.SubjectDetail;
import com.schoolenterprise.academics.dto.SubjectRequest;
import com.schoolenterprise.academics.dto.SubjectSummary;
import com.schoolenterprise.academics.dto.SectionSummary;
import com.schoolenterprise.academics.dto.TimetableEntryRequest;
import com.schoolenterprise.academics.dto.TimetableEntryResponse;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.TimetableEntryRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.dto.TeacherAssignmentResponse;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AcademicsService {

    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final SubjectClassMappingRepository subjectClassMappingRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final TimetableEntryRepository timetableEntryRepository;
    private final SchoolService schoolService;
    private final AuditService auditService;
    private final PermissionService permissionService;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassHistoryRepository classHistoryRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AppUserRepository userRepository;
    private final UserScopeRepository userScopeRepository;

    public List<DepartmentSummary> departments() {
        Long schoolId = schoolService.getSchool().getId();
        List<Department> departments =
                departmentRepository.findBySchoolId(schoolId);
        List<DepartmentSummary> summaries = departments.stream()
                .map(this::departmentSummary)
                .toList();
        return summaries;
    }

    public DepartmentDetail department(Long id) {

        Department department = departmentForSchool(id);

        Long schoolId = schoolService.getSchool().getId();

        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);

        List<SubjectSummary> subjectSummaries = new ArrayList<>();

        for (Subject subject : subjects) {

            if (Objects.equals(subject.getDepartmentId(), id)) {

                SubjectSummary summary = subjectSummary(subject);
                subjectSummaries.add(summary);
            }
        }
        return new DepartmentDetail(
                departmentSummary(department),
                subjectSummaries
        );
    }

    @Transactional
    public Department saveDepartment(Long id, DepartmentRequest request) {

        Long schoolId = schoolService.getSchool().getId();

        String name = request.getName().trim();

        Department department;

        if (id == null) {
            department = new Department();
        } else {
            department = departmentForSchool(id);
        }

        boolean duplicate = false;

        List<Department> departments =
                departmentRepository.findBySchoolId(schoolId);

        for (Department existing : departments) {

            if (!Objects.equals(existing.getId(), id)) {

                if (existing.getName().equalsIgnoreCase(name)) {
                    duplicate = true;
                    break;
                }
            }
        }

        if (duplicate) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Department name already exists in this school"
            );
        }

        department.setSchoolId(schoolId);
        department.setName(name);

        String requestedCode = blankToNull(request.getCode());

        if (requestedCode != null) {
            department.setCode(requestedCode);
        } else {

            if (department.getCode() == null) {
                String generatedCode = generatedDepartmentCode(name);
                department.setCode(generatedCode);
            }
        }
        String description = blankToNull(request.getDescription());
        department.setDescription(description);

        if (request.getStatus() == null) {
            department.setStatus("ACTIVE");
        } else {
            department.setStatus(request.getStatus());
        }

        Department saved = departmentRepository.save(department);

        auditService.record(
                "classes",
                "edit",
                "Department",
                saved.getId(),
                saved.getName()
        );

        return saved;
    }




    @Transactional
    public Department updateDepartmentStatus(Long id, String status) {
        validateStatus(status);

        Department department = departmentForSchool(id);

        department.setStatus(status);

        Department saved = departmentRepository.save(department);

        auditService.record(
                "classes",
                "edit",
                "Department",
                id,
                "Status " + status
        );

        return saved;
    }

    @Transactional
    public void deleteDepartment(Long id) {

        Department department = departmentForSchool(id);

        List<Subject> subjects =
                subjectRepository.findBySchoolId(department.getSchoolId());

        for (Subject subject : subjects) {

            if (Objects.equals(subject.getDepartmentId(), id)) {
                deleteSubject(subject.getId());
            }
        }

        List<Staff> staffList =
                staffRepository.findByDepartmentId(id);

        for (Staff staff : staffList) {

            staff.setDepartmentId(null);

            staffRepository.save(staff);
        }

        departmentRepository.delete(department);

        auditService.record(
                "classes",
                "delete",
                "Department",
                id,
                department.getName()
        );
    }

    public List<SubjectSummary> subjects() {

        List<Subject> allSubjects = subjectRepository.findAll();

        Long schoolId = schoolService.getSchool().getId();

        List<Subject> schoolSubjects = new ArrayList<>();

        for (Subject subject : allSubjects) {

            if (Objects.equals(subject.getSchoolId(), schoolId)) {
                schoolSubjects.add(subject);
            }
        }

        if (permissionService.hasSchoolWideAccess()) {

            List<SubjectSummary> summaries = new ArrayList<>();

            for (Subject subject : schoolSubjects) {
                SubjectSummary summary = subjectSummary(subject);
                summaries.add(summary);
            }

            return summaries;
        }

        Set<Long> allowedSubjectIds =
                permissionService.allowedSubjectIds();

        List<SubjectSummary> summaries = new ArrayList<>();

        for (Subject subject : schoolSubjects) {

            if (allowedSubjectIds.contains(subject.getId())) {

                SubjectSummary summary = subjectSummary(subject);

                summaries.add(summary);
            }
        }

        return summaries;
    }

    public SubjectDetail subject(Long id) {
        Subject subject = subjectForSchool(id);

        List<SubjectClassMapping> mappings =
                subjectClassMappingRepository.findBySubjectId(id);

        List<SubjectClassMappingView> mappingViews =
                new ArrayList<>();

        for (SubjectClassMapping mapping : mappings) {

            SubjectClassMappingView view = mappingView(mapping);

            mappingViews.add(view);
        }

        SubjectSummary subjectSummary = subjectSummary(subject);

        List<String> teachers = teacherNames(id);

        return new SubjectDetail(
                subjectSummary,
                mappingViews,
                teachers
        );
    }

    @Transactional
    public Subject saveSubject(Long id, SubjectRequest request) {

        Long schoolId = schoolService.getSchool().getId();

        Department department =
                departmentForSchool(request.getDepartmentId());

        if (!"ACTIVE".equals(department.getStatus())) {

            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subjects can only be assigned to an active department"
            );
        }

        String name = request.getName().trim();

        String code = request.getCode().trim().toUpperCase();

        List<Subject> subjects =
                subjectRepository.findBySchoolId(schoolId);

        boolean duplicateCode = false;

        for (Subject existing : subjects) {

            if (!Objects.equals(existing.getId(), id)) {

                if (existing.getCode().equalsIgnoreCase(code)) {
                    duplicateCode = true;
                    break;
                }
            }
        }

        if (duplicateCode) {

            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject code already exists in this school"
            );
        }

        boolean duplicateName = false;

        for (Subject existing : subjects) {
            if (!Objects.equals(existing.getId(), id)) {

                if (existing.getName().equalsIgnoreCase(name)) {
                    duplicateName = true;
                    break;
                }
            }
        }

        if (duplicateName) {

            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject name already exists in this school"
            );
        }

        Subject subject;

        if (id == null) {
            subject = new Subject();
        } else {
            subject = subjectForSchool(id);
        }

        subject.setSchoolId(schoolId);
        subject.setDepartmentId(department.getId());
        subject.setName(name);
        subject.setCode(code);

        String description = blankToNull(request.getDescription());
        subject.setDescription(description);

        if (request.getStatus() == null) {
            subject.setStatus("ACTIVE");
        } else {
            subject.setStatus(request.getStatus());
        }
        Subject saved = subjectRepository.save(subject);

        auditService.record(
                "subjects",
                "edit",
                "Subject",
                saved.getId(),
                saved.getName()
        );
        return saved;
    }

    @Transactional
    public Subject updateSubjectStatus(Long id, String status) {

        validateStatus(status);

        Subject subject = subjectForSchool(id);

        subject.setStatus(status);

        Subject savedSubject = subjectRepository.save(subject);

        auditService.record(
                "subjects",
                "edit",
                "Subject",
                id,
                "Status " + status
        );

        return savedSubject;
    }

    @Transactional
    public void deleteSubject(Long id) {
        Subject subject = subjectForSchool(id);
        subjectClassMappingRepository.deleteBySubjectId(id);
        teacherAssignmentRepository.deleteBySubjectId(id);
        timetableEntryRepository.deleteBySubjectId(id);
        subjectRepository.delete(subject);
        auditService.record("subjects", "delete", "Subject", id, subject.getName());
    }

    @Transactional
    public SubjectClassMapping mapSubjectToClass(Long subjectId, SubjectClassMappingRequest request) {
        Subject subject = subjectForSchool(subjectId);
        if (!"ACTIVE".equals(subject.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Inactive subjects cannot be mapped to classes");
        }
        SchoolClass schoolClass = classForSchool(request.getClassId());
        AcademicYear year = schoolService.year(request.getAcademicYearId());
        if (!"ACTIVE".equals(year.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subjects can only be mapped to an active academic year");
        }
        if (subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(
                subjectId, schoolClass.getId(), year.getId())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject is already mapped to this class and academic year");
        }
        SubjectClassMapping mapping = new SubjectClassMapping();
        mapping.setSubjectId(subjectId);
        mapping.setClassId(schoolClass.getId());
        mapping.setAcademicYearId(year.getId());
        SubjectClassMapping saved = subjectClassMappingRepository.save(mapping);
        auditService.record("subjects", "edit", "SubjectClassMapping", saved.getId(),
                subject.getName() + " -> " + schoolClass.getName());
        return saved;
    }

    @Transactional
    public void removeSubjectClassMapping(Long subjectId, Long classId, Long academicYearId) {
        subjectForSchool(subjectId);
        classForSchool(classId);
        schoolService.year(academicYearId);
        SubjectClassMapping mapping = subjectClassMappingRepository
                .findBySubjectIdAndClassIdAndAcademicYearId(subjectId, classId, academicYearId)
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound(
                        "Subject-class mapping not found"));
        subjectClassMappingRepository.delete(mapping);
        auditService.record("subjects", "delete", "SubjectClassMapping", mapping.getId(), "Mapping removed");
    }

    public List<SubjectClassMappingView> classesForSubject(Long subjectId) {
        subjectForSchool(subjectId);
        return subjectClassMappingRepository.findBySubjectId(subjectId).stream()
                .map(this::mappingView)
                .toList();
    }

    public List<SubjectSummary> subjectsForClass(Long classId, Long academicYearId) {
        classForSchool(classId);
        schoolService.year(academicYearId);
        return subjectClassMappingRepository.findByClassIdAndAcademicYearId(classId, academicYearId).stream()
                .map(mapping -> subjectSummary(subjectForSchool(mapping.getSubjectId())))
                .toList();
    }

    private DepartmentSummary departmentSummary(Department department) {
        return new DepartmentSummary(
                department.getId(),
                department.getSchoolId(),
                department.getName(),
                department.getCode(),
                department.getDescription(),
                department.getStatus(),
                subjectRepository.countByDepartmentId(department.getId()),
                staffRepository.countByDepartmentId(department.getId()));
    }

    private SubjectSummary subjectSummary(Subject subject) {
        String departmentName = subject.getDepartmentId() == null
                ? "Unassigned"
                : departmentRepository.findById(subject.getDepartmentId())
                        .map(Department::getName)
                        .orElse("Unassigned");
        List<Long> classIds = subjectClassMappingRepository.findBySubjectId(subject.getId()).stream()
                .map(SubjectClassMapping::getClassId)
                .distinct()
                .toList();
        return new SubjectSummary(subject.getId(), subject.getSchoolId(), subject.getDepartmentId(),
                departmentName, subject.getName(), subject.getCode(), subject.getDescription(),
                subject.getStatus(), classIds);
    }

    private SubjectClassMappingView mappingView(SubjectClassMapping mapping) {
        String className = classRepository.findById(mapping.getClassId())
                .map(SchoolClass::getName)
                .orElse("Class " + mapping.getClassId());
        String yearName = academicYearRepository.findById(mapping.getAcademicYearId())
                .map(AcademicYear::getName)
                .orElse("Year " + mapping.getAcademicYearId());
        return new SubjectClassMappingView(mapping.getId(), mapping.getSubjectId(), mapping.getClassId(),
                className, mapping.getAcademicYearId(), yearName);
    }

    private List<String> teacherNames(Long subjectId) {
        return teacherAssignmentRepository.findBySubjectId(subjectId).stream()
                .map(assignment -> staffRepository.findById(assignment.getStaffId())
                        .map(Staff::getFullName)
                        .orElse("Staff " + assignment.getStaffId()))
                .distinct()
                .toList();
    }

    private Department departmentForSchool(Long id) {
        if (id == null) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Department is required");
        }
        return departmentRepository.findById(id)
                .filter(department -> Objects.equals(department.getSchoolId(), schoolService.getSchool().getId()))
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Department not found"));
    }

    private Subject subjectForSchool(Long id) {
        if (id == null) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Subject is required");
        }
        return subjectRepository.findById(id)
                .filter(subject -> Objects.equals(subject.getSchoolId(), schoolService.getSchool().getId()))
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Subject not found"));
    }

    private SchoolClass classForSchool(Long id) {
        return classRepository.findById(id)
                .filter(schoolClass -> Objects.equals(schoolClass.getSchoolId(), schoolService.getSchool().getId()))
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Class not found"));
    }

    private void validateStatus(String status) {
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Status must be ACTIVE or INACTIVE");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String generatedDepartmentCode(String name) {
        String code = name.replaceAll("[^A-Za-z0-9]+", "_").toUpperCase();
        return code.length() > 30 ? code.substring(0, 30) : code;
    }

    public List<SchoolClass> classes() {
        Map<String, SchoolClass> grouped = new LinkedHashMap<>();
        for (SchoolClass item : classRepository.findBySchoolId(schoolService.getSchool().getId())) {
            String key = item.getName().trim().toUpperCase();
            SchoolClass existing = grouped.get(key);
            if (existing == null) {
                grouped.put(key, item);
            } else {
                int currentRooms = existing.getNumberOfClassrooms() == null
                        ? 0 : existing.getNumberOfClassrooms();
                int itemRooms = item.getNumberOfClassrooms() == null
                        ? 0 : item.getNumberOfClassrooms();
                existing.setNumberOfClassrooms(currentRooms + itemRooms);
            }
        }
        return List.copyOf(grouped.values());
    }

    public SchoolClass saveClass(SchoolClass c) {
        Long schoolId = schoolService.getSchool().getId();
        c.setName(c.getName().trim());
        if (c.getNumberOfClassrooms() == null || c.getNumberOfClassrooms() < 1) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Number of classrooms must be at least 1");
        }
        if (c.getId() == null) {
            SchoolClass existing = classRepository.findBySchoolId(schoolId).stream()
                    .filter(item -> item.getName().equalsIgnoreCase(c.getName()))
                    .findFirst()
                    .orElse(null);
            if (existing != null) {
                int currentRooms = existing.getNumberOfClassrooms() == null
                        ? 0 : existing.getNumberOfClassrooms();
                existing.setNumberOfClassrooms(currentRooms + c.getNumberOfClassrooms());
                SchoolClass merged = classRepository.save(existing);
                auditService.record("classes", "edit", "SchoolClass", merged.getId(),
                        merged.getName() + " classrooms increased");
                return merged;
            }
        }
        c.setSchoolId(schoolId);
        SchoolClass saved = classRepository.save(c);
        auditService.record("classes", "edit", "SchoolClass", saved.getId(), saved.getName());
        return saved;
    }

    public List<SectionSummary> sections() {
        List<Section> all = distinctSections(sectionRepository.findAll());
        if (permissionService.hasSchoolWideAccess()) {
            return all.stream().map(this::sectionSummary).toList();
        }
        return all.stream()
                .filter(s -> permissionService.allowedSectionIds().contains(s.getId()))
                .map(this::sectionSummary)
                .toList();
    }

    private List<Section> distinctSections(List<Section> sections) {
        Map<String, Section> unique = new LinkedHashMap<>();
        for (Section section : sections) {
            String key = section.getClassId() + ":" + section.getAcademicYearId() + ":"
                    + section.getName().trim().toUpperCase();
            unique.putIfAbsent(key, section);
        }
        return List.copyOf(unique.values());
    }

    public SectionSummary sectionSummary(Section section) {
        String className = classRepository.findById(section.getClassId())
                .map(SchoolClass::getName)
                .orElse("Class " + section.getClassId());
        String yearName = academicYearRepository.findById(section.getAcademicYearId())
                .map(AcademicYear::getName)
                .orElse("Year " + section.getAcademicYearId());
        String teacherName = section.getClassTeacherStaffId() == null
                ? null
                : staffRepository.findById(section.getClassTeacherStaffId())
                        .map(Staff::getFullName)
                        .orElse(null);
        return new SectionSummary(
                section.getId(),
                section.getName(),
                section.getClassId(),
                className,
                section.getAcademicYearId(),
                yearName,
                section.getClassTeacherStaffId(),
                teacherName,
                studentRepository.countByCurrentSectionId(section.getId()),
                section.getStatus());
    }

    public Section sectionForSchool(Long id) {
        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Section not found"));
        SchoolClass schoolClass = classRepository.findById(section.getClassId())
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Class not found"));
        if (!Objects.equals(schoolClass.getSchoolId(), schoolService.getSchool().getId())) {
            throw com.schoolenterprise.common.exception.AppException.notFound("Section not found");
        }
        return section;
    }

    public SectionDetailResponse sectionDetail(Long sectionId) {
        Section section = sectionForSchool(sectionId);
        SectionSummary summary = sectionSummary(section);
        List<SubjectSummary> subjects = subjectsForClass(section.getClassId(), section.getAcademicYearId());
        
        List<TeacherAssignmentResponse> teacherAssignments = teacherAssignmentRepository.findAll().stream()
                .filter(a -> a.getClassId().equals(section.getClassId())
                        && a.getAcademicYearId().equals(section.getAcademicYearId())
                        && (a.getSectionId() == null || a.getSectionId().equals(section.getId()))
                        && "ACTIVE".equals(a.getStatus()))
                .map(a -> new TeacherAssignmentResponse(
                        a,
                        staffRepository.findById(a.getStaffId()).map(Staff::getFullName).orElse(null),
                        a.getSubjectId() == null ? null : subjectRepository.findById(a.getSubjectId()).map(Subject::getName).orElse(null),
                        summary.className(),
                        section.getName(),
                        summary.academicYearName()
                ))
                .toList();

        List<TimetableEntryResponse> timetable = timetableEntries(section.getId(), null, null, null);

        return new SectionDetailResponse(summary, subjects, teacherAssignments, timetable);
    }

    @Transactional
    public Section saveSection(Section s) {
        Long schoolId = schoolService.getSchool().getId();
        SchoolClass schoolClass = classRepository.findById(s.getClassId())
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Class not found"));
        if (!schoolId.equals(schoolClass.getSchoolId())) {
            throw com.schoolenterprise.common.exception.AppException.notFound("Class not found");
        }
        AcademicYear year = schoolService.year(s.getAcademicYearId());
        if (!"ACTIVE".equals(year.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Sections require an active academic year");
        }
        s.setName(s.getName().trim().toUpperCase());
        if (s.getStatus() == null || s.getStatus().isBlank()) {
            s.setStatus("ACTIVE");
        }
        boolean duplicate = sectionRepository.findByClassId(s.getClassId()).stream()
                .anyMatch(existing -> existing.getAcademicYearId().equals(s.getAcademicYearId())
                        && existing.getName().equalsIgnoreCase(s.getName())
                        && !existing.getId().equals(s.getId()));
        if (duplicate) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Section already exists for this class and year");
        }
        long sectionCount = sectionRepository.findByClassId(s.getClassId()).stream()
                .filter(existing -> existing.getAcademicYearId().equals(s.getAcademicYearId()))
                .filter(existing -> !existing.getId().equals(s.getId()))
                .map(existing -> existing.getName().trim().toUpperCase())
                .collect(java.util.stream.Collectors.toSet())
                .size();
        if (sectionCount >= schoolClass.getNumberOfClassrooms()) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Cannot create another section: this class has "
                            + schoolClass.getNumberOfClassrooms() + " classroom(s) and already has "
                            + sectionCount + " section(s) for the selected academic year");
        }
        Section saved = sectionRepository.save(s);
        if (saved.getClassTeacherStaffId() != null) {
            grantSectionScopeToClassTeacher(saved.getClassTeacherStaffId(), saved.getId());
        }
        auditService.record("classes", "edit", "Section", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Section updateSectionStatus(Long id, String status) {
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Section status must be ACTIVE or INACTIVE");
        }
        Section section = sectionForSchool(id);
        section.setStatus(status);
        Section saved = sectionRepository.save(section);
        auditService.record("classes", "edit", "Section", saved.getId(), saved.getName() + " status changed");
        return saved;
    }

    @Transactional
    public void deleteSection(Long id) {
        Section section = sectionForSchool(id);
        if (studentRepository.countByCurrentSectionId(id) > 0
                || !enrollmentRepository.findBySectionId(id).isEmpty()
                || classHistoryRepository.existsBySectionId(id)
                || teacherAssignmentRepository.existsBySectionId(id)) {
            section.setStatus("INACTIVE");
            sectionRepository.save(section);
            auditService.record("classes", "edit", "Section", id, section.getName() + " deactivated");
            return;
        }
        timetableEntryRepository.deleteBySectionId(id);
        sectionRepository.delete(section);
        auditService.record("classes", "delete", "Section", id, section.getName());
    }

    // ================= Timetable Management =================

    public List<TimetableEntryResponse> timetableEntries(Long sectionId, Long classId, Long academicYearId, Long staffId) {
        Long schoolId = schoolService.getSchool().getId();
        List<TimetableEntry> entries = timetableEntryRepository.findBySchoolId(schoolId);

        return entries.stream()
                .filter(e -> sectionId == null || Objects.equals(e.getSectionId(), sectionId))
                .filter(e -> classId == null || Objects.equals(e.getClassId(), classId))
                .filter(e -> academicYearId == null || Objects.equals(e.getAcademicYearId(), academicYearId))
                .filter(e -> staffId == null || Objects.equals(e.getStaffId(), staffId))
                .map(this::timetableResponse)
                .toList();
    }

    public TimetableEntryResponse timetableEntry(Long id) {
        TimetableEntry entry = timetableForSchool(id);
        return timetableResponse(entry);
    }

    @Transactional
    public TimetableEntryResponse saveTimetableEntry(Long id, TimetableEntryRequest request) {
        Long schoolId = schoolService.getSchool().getId();
        SchoolClass schoolClass = classForSchool(request.getClassId());
        Section section = sectionForSchool(request.getSectionId());
        AcademicYear year = schoolService.year(request.getAcademicYearId());
        Subject subject = subjectForSchool(request.getSubjectId());
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Staff member not found"));

        if (!"ACTIVE".equals(staff.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Selected teacher is inactive");
        }
        if (!"ACTIVE".equals(subject.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Selected subject is inactive");
        }
        if (!section.getClassId().equals(schoolClass.getId()) || !section.getAcademicYearId().equals(year.getId())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Section does not belong to the selected class and academic year");
        }

        // 1. Validate that the Subject is mapped to this Class and Academic Year
        boolean subjectMapped = subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(
                subject.getId(), schoolClass.getId(), year.getId());
        if (!subjectMapped) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject '" + subject.getName() + "' is not associated with " + schoolClass.getName() + " for this academic year");
        }

        // 2. Validate that the Teacher is assigned to this Class / Section / Subject
        boolean teacherAssigned = teacherAssignmentRepository.findAll().stream().anyMatch(a ->
                "ACTIVE".equals(a.getStatus())
                        && a.getStaffId().equals(staff.getId())
                        && a.getClassId().equals(schoolClass.getId())
                        && a.getAcademicYearId().equals(year.getId())
                        && (a.getSectionId() == null || a.getSectionId().equals(section.getId()))
                        && (a.getSubjectId() == null || a.getSubjectId().equals(subject.getId())));
        if (!teacherAssigned) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Teacher " + staff.getFullName() + " is not assigned to teach " + subject.getName() + " in this section");
        }

        String day = request.getDayOfWeek().trim().toUpperCase();
        Integer period = request.getPeriodNumber();
        String room = blankToNull(request.getRoom());

        // 3. Conflict Check: Section slot conflict
        boolean sectionConflict = timetableEntryRepository.findBySectionIdAndAcademicYearId(section.getId(), year.getId()).stream()
                .anyMatch(e -> !Objects.equals(e.getId(), id)
                        && "ACTIVE".equals(e.getStatus())
                        && e.getDayOfWeek().equalsIgnoreCase(day)
                        && Objects.equals(e.getPeriodNumber(), period));
        if (sectionConflict) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Section " + section.getName() + " already has a class scheduled on " + day + " for Period " + period);
        }

        // 4. Conflict Check: Teacher conflict across any class in the school
        boolean teacherConflict = timetableEntryRepository.findBySchoolIdAndAcademicYearId(schoolId, year.getId()).stream()
                .anyMatch(e -> !Objects.equals(e.getId(), id)
                        && "ACTIVE".equals(e.getStatus())
                        && Objects.equals(e.getStaffId(), staff.getId())
                        && e.getDayOfWeek().equalsIgnoreCase(day)
                        && Objects.equals(e.getPeriodNumber(), period));
        if (teacherConflict) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Teacher " + staff.getFullName() + " is already scheduled for another class on " + day + " Period " + period);
        }

        // 5. Conflict Check: Room conflict if room is specified
        if (room != null) {
            boolean roomConflict = timetableEntryRepository.findBySchoolIdAndAcademicYearId(schoolId, year.getId()).stream()
                    .anyMatch(e -> !Objects.equals(e.getId(), id)
                            && "ACTIVE".equals(e.getStatus())
                            && e.getRoom() != null
                            && e.getRoom().trim().equalsIgnoreCase(room)
                            && e.getDayOfWeek().equalsIgnoreCase(day)
                            && Objects.equals(e.getPeriodNumber(), period));
            if (roomConflict) {
                throw com.schoolenterprise.common.exception.AppException.badRequest(
                        "Room '" + room + "' is already occupied on " + day + " Period " + period);
            }
        }

        TimetableEntry entry = id == null ? new TimetableEntry() : timetableForSchool(id);
        entry.setSchoolId(schoolId);
        entry.setClassId(schoolClass.getId());
        entry.setSectionId(section.getId());
        entry.setAcademicYearId(year.getId());
        entry.setDayOfWeek(day);
        entry.setPeriodNumber(period);
        entry.setPeriodName(blankToNull(request.getPeriodName()) != null ? request.getPeriodName().trim() : "Period " + period);
        entry.setStartTime(blankToNull(request.getStartTime()));
        entry.setEndTime(blankToNull(request.getEndTime()));
        entry.setSubjectId(subject.getId());
        entry.setStaffId(staff.getId());
        entry.setRoom(room);
        entry.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());

        TimetableEntry saved = timetableEntryRepository.save(entry);
        auditService.record("classes", "edit", "TimetableEntry", saved.getId(),
                schoolClass.getName() + "-" + section.getName() + " " + day + " P" + period + " (" + subject.getName() + ")");
        return timetableResponse(saved);
    }

    @Transactional
    public void deleteTimetableEntry(Long id) {
        TimetableEntry entry = timetableForSchool(id);
        timetableEntryRepository.delete(entry);
        auditService.record("classes", "delete", "TimetableEntry", id, "Period " + entry.getPeriodNumber() + " removed");
    }

    private TimetableEntry timetableForSchool(Long id) {
        if (id == null) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Timetable entry ID is required");
        }
        return timetableEntryRepository.findById(id)
                .filter(e -> Objects.equals(e.getSchoolId(), schoolService.getSchool().getId()))
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Timetable entry not found"));
    }

    private TimetableEntryResponse timetableResponse(TimetableEntry entry) {
        String className = classRepository.findById(entry.getClassId()).map(SchoolClass::getName).orElse(null);
        String sectionName = sectionRepository.findById(entry.getSectionId()).map(Section::getName).orElse(null);
        String yearName = academicYearRepository.findById(entry.getAcademicYearId()).map(AcademicYear::getName).orElse(null);
        Subject subject = subjectRepository.findById(entry.getSubjectId()).orElse(null);
        String teacherName = staffRepository.findById(entry.getStaffId()).map(Staff::getFullName).orElse(null);

        return new TimetableEntryResponse(
                entry.getId(),
                entry.getSchoolId(),
                entry.getClassId(),
                className,
                entry.getSectionId(),
                sectionName,
                entry.getAcademicYearId(),
                yearName,
                entry.getDayOfWeek(),
                entry.getPeriodNumber(),
                entry.getPeriodName(),
                entry.getStartTime(),
                entry.getEndTime(),
                entry.getSubjectId(),
                subject != null ? subject.getName() : null,
                subject != null ? subject.getCode() : null,
                entry.getStaffId(),
                teacherName,
                entry.getRoom(),
                entry.getStatus()
        );
    }

    private void grantSectionScopeToClassTeacher(Long staffId, Long sectionId) {
        Staff staff = staffRepository.findById(staffId).orElse(null);
        if (staff == null || staff.getUserId() == null) {
            return;
        }
        boolean exists = userScopeRepository.findByUserId(staff.getUserId()).stream()
                .anyMatch(sc -> "SECTION".equals(sc.getScopeType()) && sectionId.equals(sc.getScopeId()));
        if (exists) {
            return;
        }
        AppUser user = userRepository.findById(staff.getUserId()).orElse(null);
        if (user == null) {
            return;
        }
        UserScope scope = new UserScope();
        scope.setUser(user);
        scope.setScopeType("SECTION");
        scope.setScopeId(sectionId);
        userScopeRepository.save(scope);
    }
}
