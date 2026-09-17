package com.schoolenterprise.academics.service;

import com.schoolenterprise.academics.entity.Department;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.entity.SubjectClassMapping;
import com.schoolenterprise.academics.dto.DepartmentDetail;
import com.schoolenterprise.academics.dto.DepartmentRequest;
import com.schoolenterprise.academics.dto.DepartmentSummary;
import com.schoolenterprise.academics.dto.SubjectClassMappingRequest;
import com.schoolenterprise.academics.dto.SubjectClassMappingView;
import com.schoolenterprise.academics.dto.SubjectDetail;
import com.schoolenterprise.academics.dto.SubjectRequest;
import com.schoolenterprise.academics.dto.SubjectSummary;
import com.schoolenterprise.academics.dto.SectionSummary;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AcademicsService {

    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final SubjectClassMappingRepository subjectClassMappingRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
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
        return departmentRepository.findBySchoolId(schoolId).stream()
                .map(this::departmentSummary)
                .toList();
    }

    public DepartmentDetail department(Long id) {
        Department department = departmentForSchool(id);
        List<SubjectSummary> subjects = subjectRepository.findBySchoolId(schoolService.getSchool().getId()).stream()
                .filter(subject -> Objects.equals(subject.getDepartmentId(), id))
                .map(this::subjectSummary)
                .toList();
        return new DepartmentDetail(departmentSummary(department), subjects);
    }

    @Transactional
    public Department saveDepartment(Long id, DepartmentRequest request) {
        Long schoolId = schoolService.getSchool().getId();
        String name = request.getName().trim();
        Department department = id == null
                ? new Department()
                : departmentForSchool(id);
        boolean duplicate = departmentRepository.findBySchoolId(schoolId).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), id)
                        && existing.getName().equalsIgnoreCase(name));
        if (duplicate) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Department name already exists in this school");
        }
        department.setSchoolId(schoolId);
        department.setName(name);
        String requestedCode = blankToNull(request.getCode());
        department.setCode(requestedCode != null
                ? requestedCode
                : (department.getCode() == null ? generatedDepartmentCode(name) : department.getCode()));
        department.setDescription(blankToNull(request.getDescription()));
        department.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        Department saved = departmentRepository.save(department);
        auditService.record("classes", "edit", "Department", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Department updateDepartmentStatus(Long id, String status) {
        validateStatus(status);
        Department department = departmentForSchool(id);
        department.setStatus(status);
        Department saved = departmentRepository.save(department);
        auditService.record("classes", "edit", "Department", id, "Status " + status);
        return saved;
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentForSchool(id);
        for (Subject subject : subjectRepository.findBySchoolId(department.getSchoolId()).stream()
                .filter(item -> Objects.equals(item.getDepartmentId(), id))
                .toList()) {
            deleteSubject(subject.getId());
        }
        for (Staff staff : staffRepository.findByDepartmentId(id)) {
            staff.setDepartmentId(null);
            staffRepository.save(staff);
        }
        departmentRepository.delete(department);
        auditService.record("classes", "delete", "Department", id, department.getName());
    }

    public List<SubjectSummary> subjects() {
        List<Subject> all = subjectRepository.findAll();
        Long schoolId = schoolService.getSchool().getId();
        List<Subject> schoolSubjects = all.stream()
                .filter(subject -> Objects.equals(subject.getSchoolId(), schoolId))
                .toList();
        if (permissionService.hasSchoolWideAccess()) {
            return schoolSubjects.stream().map(this::subjectSummary).toList();
        }
        return schoolSubjects.stream()
                .filter(s -> permissionService.allowedSubjectIds().contains(s.getId()))
                .map(this::subjectSummary)
                .toList();
    }

    public SubjectDetail subject(Long id) {
        Subject subject = subjectForSchool(id);
        return new SubjectDetail(
                subjectSummary(subject),
                subjectClassMappingRepository.findBySubjectId(id).stream()
                        .map(this::mappingView)
                        .toList(),
                teacherNames(id));
    }

    @Transactional
    public Subject saveSubject(Long id, SubjectRequest request) {
        Long schoolId = schoolService.getSchool().getId();
        Department department = departmentForSchool(request.getDepartmentId());
        if (!"ACTIVE".equals(department.getStatus())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subjects can only be assigned to an active department");
        }
        String name = request.getName().trim();
        String code = request.getCode().trim().toUpperCase();
        boolean duplicateCode = subjectRepository.findBySchoolId(schoolId).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), id)
                        && existing.getCode().equalsIgnoreCase(code));
        if (duplicateCode) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject code already exists in this school");
        }
        boolean duplicateName = subjectRepository.findBySchoolId(schoolId).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), id)
                        && existing.getName().equalsIgnoreCase(name));
        if (duplicateName) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Subject name already exists in this school");
        }
        Subject subject = id == null ? new Subject() : subjectForSchool(id);
        subject.setSchoolId(schoolId);
        subject.setDepartmentId(department.getId());
        subject.setName(name);
        subject.setCode(code);
        subject.setDescription(blankToNull(request.getDescription()));
        subject.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        Subject saved = subjectRepository.save(subject);
        auditService.record("subjects", "edit", "Subject", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Subject updateSubjectStatus(Long id, String status) {
        validateStatus(status);
        Subject subject = subjectForSchool(id);
        subject.setStatus(status);
        Subject saved = subjectRepository.save(subject);
        auditService.record("subjects", "edit", "Subject", id, "Status " + status);
        return saved;
    }

    @Transactional
    public void deleteSubject(Long id) {
        Subject subject = subjectForSchool(id);
        subjectClassMappingRepository.deleteBySubjectId(id);
        teacherAssignmentRepository.deleteBySubjectId(id);
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
                .filter(s -> permissionService.allowedSectionIds().contains(s.getId())
                        || permissionService.allowedClassIds().contains(s.getClassId()))
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

    private SectionSummary sectionSummary(Section section) {
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
        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Section not found"));
        SchoolClass schoolClass = classRepository.findById(section.getClassId())
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Class not found"));
        if (!schoolService.getSchool().getId().equals(schoolClass.getSchoolId())) {
            throw com.schoolenterprise.common.exception.AppException.notFound("Section not found");
        }
        section.setStatus(status);
        Section saved = sectionRepository.save(section);
        auditService.record("classes", "edit", "Section", saved.getId(), saved.getName() + " status changed");
        return saved;
    }

    @Transactional
    public void deleteSection(Long id) {
        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Section not found"));
        SchoolClass schoolClass = classRepository.findById(section.getClassId())
                .orElseThrow(() -> com.schoolenterprise.common.exception.AppException.notFound("Class not found"));
        if (!schoolService.getSchool().getId().equals(schoolClass.getSchoolId())) {
            throw com.schoolenterprise.common.exception.AppException.notFound("Section not found");
        }
        if (studentRepository.countByCurrentSectionId(id) > 0
                || !enrollmentRepository.findBySectionId(id).isEmpty()
                || classHistoryRepository.existsBySectionId(id)
                || teacherAssignmentRepository.existsBySectionId(id)) {
            section.setStatus("INACTIVE");
            sectionRepository.save(section);
            auditService.record("classes", "edit", "Section", id, section.getName() + " deactivated");
            return;
        }
        sectionRepository.delete(section);
        auditService.record("classes", "delete", "Section", id, section.getName());
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
