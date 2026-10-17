package com.schoolenterprise.teacher.service;

import com.schoolenterprise.academics.dto.TimetableEntryResponse;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.entity.TimetableEntry;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.TimetableEntryRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.dto.TeacherAssignmentResponse;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.StudentRepository;
import com.schoolenterprise.teacher.dto.TeacherPortalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherPortalService {
    private final PermissionService permissionService;
    private final TeacherScopeResolver teacherScopeResolver;
    private final AppUserRepository userRepository;
    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository assignmentRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentRepository studentRepository;
    private final TimetableEntryRepository timetableEntryRepository;

    @Transactional(readOnly = true)
    public TeacherPortalResponse.Profile profile() {
        AppUserDetails principal = currentTeacher();
        TeacherScope scope = teacherScopeResolver.resolve(principal);
        AppUser user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> AppException.notFound("Profile not found"));
        Staff staff = staffRepository.findById(scope.staffId())
                .orElseThrow(() -> AppException.notFound("Profile not found"));
        return new TeacherPortalResponse.Profile(user.getId(), staff.getId(), staff.getEmployeeId(),
                staff.getFullName(), user.getEmail(), staff.getPhone());
    }

    @Transactional(readOnly = true)
    public List<TeacherAssignmentResponse> assignments(Long academicYearId) {
        TeacherScope scope = scope();
        if (academicYearId != null && !scope.academicYearIds().contains(academicYearId)) {
            return List.of();
        }
        return activeAssignments(scope).stream()
                .filter(assignment -> academicYearId == null
                        || academicYearId.equals(assignment.getAcademicYearId()))
                .map(this::assignmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherAssignmentResponse assignment(Long id) {
        TeacherScope scope = scope();
        if (!scope.assignmentIds().contains(id)) {
            throw AppException.notFound("Assignment not found");
        }
        TeacherAssignment assignment = assignmentRepository.findById(id)
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Assignment not found"));
        return assignmentResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<TeacherPortalResponse.SchoolClassView> classes() {
        TeacherScope scope = scope();
        return classRepository.findAllById(scope.classIds()).stream()
                .map(this::classView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherPortalResponse.SchoolClassView schoolClass(Long id) {
        TeacherScope scope = scope();
        if (!scope.classIds().contains(id)) {
            throw AppException.notFound("Class not found");
        }
        return classRepository.findById(id).map(this::classView)
                .orElseThrow(() -> AppException.notFound("Class not found"));
    }

    @Transactional(readOnly = true)
    public List<TeacherPortalResponse.SectionView> sections() {
        TeacherScope scope = scope();
        return sectionRepository.findAllById(scope.sectionIds()).stream()
                .filter(section -> "ACTIVE".equals(section.getStatus())
                        && scope.academicYearIds().contains(section.getAcademicYearId()))
                .map(this::sectionView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherPortalResponse.SectionView section(Long id) {
        TeacherScope scope = scope();
        if (!scope.sectionIds().contains(id)) {
            throw AppException.notFound("Section not found");
        }
        Section section = sectionRepository.findById(id)
                .filter(value -> "ACTIVE".equals(value.getStatus())
                        && scope.academicYearIds().contains(value.getAcademicYearId()))
                .orElseThrow(() -> AppException.notFound("Section not found"));
        return sectionView(section);
    }

    @Transactional(readOnly = true)
    public List<TeacherPortalResponse.SubjectView> subjects() {
        TeacherScope scope = scope();
        return subjectRepository.findAllById(scope.subjectIds()).stream()
                .filter(subject -> "ACTIVE".equals(subject.getStatus()))
                .map(this::subjectView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherPortalResponse.SubjectView subject(Long id) {
        TeacherScope scope = scope();
        if (!scope.subjectIds().contains(id)) {
            throw AppException.notFound("Subject not found");
        }
        Subject subject = subjectRepository.findById(id)
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Subject not found"));
        return subjectView(subject);
    }

    @Transactional(readOnly = true)
    public List<TeacherPortalResponse.AcademicYearView> academicYears() {
        TeacherScope scope = scope();
        return academicYearRepository.findAllById(scope.academicYearIds()).stream()
                .filter(year -> "ACTIVE".equals(year.getStatus()))
                .map(this::yearView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherPortalResponse.AcademicYearView academicYear(Long id) {
        TeacherScope scope = scope();
        if (!scope.academicYearIds().contains(id)) {
            throw AppException.notFound("Academic year not found");
        }
        AcademicYear year = academicYearRepository.findById(id)
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        return yearView(year);
    }

    @Transactional(readOnly = true)
    public List<TeacherPortalResponse.StudentRosterEntry> students(Long sectionId) {
        TeacherScope scope = scope();
        if (!scope.sectionIds().contains(sectionId)) {
            throw AppException.notFound("Section not found");
        }
        return studentRepository.findByCurrentSectionIdIn(List.of(sectionId)).stream()
                .filter(student -> "ACTIVE".equals(student.getStatus())
                        && sectionId.equals(student.getCurrentSectionId()))
                .map(this::studentView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherPortalResponse.StudentRosterEntry student(Long id) {
        TeacherScope scope = scope();
        Student student = studentRepository.findById(id)
                .filter(value -> "ACTIVE".equals(value.getStatus())
                        && value.getCurrentSectionId() != null
                        && scope.sectionIds().contains(value.getCurrentSectionId()))
                .orElseThrow(() -> AppException.notFound("Student not found"));
        return studentView(student);
    }

    @Transactional(readOnly = true)
    public List<TimetableEntryResponse> timetable(Long academicYearId) {
        TeacherScope scope = scope();
        if (academicYearId != null && !scope.academicYearIds().contains(academicYearId)) {
            return List.of();
        }
        List<TeacherAssignment> assignments = activeAssignments(scope);
        return scope.academicYearIds().stream()
                .filter(yearId -> academicYearId == null || academicYearId.equals(yearId))
                .flatMap(yearId -> timetableEntryRepository
                        .findByStaffIdAndAcademicYearId(scope.staffId(), yearId).stream())
                .filter(entry -> "ACTIVE".equals(entry.getStatus())
                        && scope.classIds().contains(entry.getClassId())
                        && scope.sectionIds().contains(entry.getSectionId())
                        && assignmentMatchesTimetable(assignments, entry))
                .map(this::timetableView)
                .toList();
    }

    private AppUserDetails currentTeacher() {
        AppUserDetails user = permissionService.currentUser();
        if (!permissionService.isTeacher(user)) {
            throw AppException.forbidden("Teacher portal access is required");
        }
        return user;
    }

    private TeacherScope scope() {
        return teacherScopeResolver.resolve(currentTeacher());
    }

    private List<TeacherAssignment> activeAssignments(TeacherScope scope) {
        return assignmentRepository.findByStaffId(scope.staffId()).stream()
                .filter(assignment -> scope.assignmentIds().contains(assignment.getId())
                        && "ACTIVE".equals(assignment.getStatus()))
                .toList();
    }

    private boolean assignmentMatchesTimetable(List<TeacherAssignment> assignments, TimetableEntry entry) {
        return assignments.stream().anyMatch(assignment ->
                assignment.getClassId().equals(entry.getClassId())
                        && assignment.getAcademicYearId().equals(entry.getAcademicYearId())
                        && ("CLASS_TEACHER".equals(assignment.getAssignmentType())
                        && assignment.getSectionId() != null
                        && assignment.getSectionId().equals(entry.getSectionId())
                        || "SUBJECT_TEACHER".equals(assignment.getAssignmentType())
                        && assignment.getSubjectId() != null
                        && assignment.getSubjectId().equals(entry.getSubjectId())
                        && (assignment.getSectionId() == null
                        || assignment.getSectionId().equals(entry.getSectionId()))));
    }

    private TeacherAssignmentResponse assignmentResponse(TeacherAssignment assignment) {
        return new TeacherAssignmentResponse(assignment,
                staffRepository.findById(assignment.getStaffId()).map(Staff::getFullName).orElse(null),
                assignment.getSubjectId() == null ? null
                        : subjectRepository.findById(assignment.getSubjectId()).map(Subject::getName).orElse(null),
                classRepository.findById(assignment.getClassId()).map(SchoolClass::getName).orElse(null),
                assignment.getSectionId() == null ? null
                        : sectionRepository.findById(assignment.getSectionId()).map(Section::getName).orElse(null),
                academicYearRepository.findById(assignment.getAcademicYearId())
                        .map(AcademicYear::getName).orElse(null));
    }

    private TeacherPortalResponse.SchoolClassView classView(SchoolClass schoolClass) {
        return new TeacherPortalResponse.SchoolClassView(schoolClass.getId(), schoolClass.getSchoolId(),
                schoolClass.getName(), schoolClass.getNumberOfClassrooms());
    }

    private TeacherPortalResponse.SectionView sectionView(Section section) {
        return new TeacherPortalResponse.SectionView(section.getId(), section.getName(), section.getClassId(),
                section.getAcademicYearId(), section.getStatus());
    }

    private TeacherPortalResponse.SubjectView subjectView(Subject subject) {
        return new TeacherPortalResponse.SubjectView(subject.getId(), subject.getSchoolId(), subject.getName(),
                subject.getCode(), subject.getDescription());
    }

    private TeacherPortalResponse.AcademicYearView yearView(AcademicYear year) {
        return new TeacherPortalResponse.AcademicYearView(year.getId(), year.getName(), year.getStatus(),
                year.isCurrentYear());
    }

    private TeacherPortalResponse.StudentRosterEntry studentView(Student student) {
        String fullName = ((student.getFirstName() == null ? "" : student.getFirstName().trim()) + " "
                + (student.getLastName() == null ? "" : student.getLastName().trim())).trim();
        return new TeacherPortalResponse.StudentRosterEntry(student.getAdmissionNumber(), fullName);
    }

    private TimetableEntryResponse timetableView(TimetableEntry entry) {
        SchoolClass schoolClass = classRepository.findById(entry.getClassId()).orElse(null);
        Section section = sectionRepository.findById(entry.getSectionId()).orElse(null);
        AcademicYear year = academicYearRepository.findById(entry.getAcademicYearId()).orElse(null);
        Subject subject = subjectRepository.findById(entry.getSubjectId()).orElse(null);
        Staff staff = staffRepository.findById(entry.getStaffId()).orElse(null);
        return new TimetableEntryResponse(entry.getId(), entry.getSchoolId(), entry.getClassId(),
                schoolClass == null ? null : schoolClass.getName(), entry.getSectionId(),
                section == null ? null : section.getName(), entry.getAcademicYearId(),
                year == null ? null : year.getName(), entry.getDayOfWeek(), entry.getPeriodNumber(),
                entry.getPeriodName(), entry.getStartTime(), entry.getEndTime(), entry.getSubjectId(),
                subject == null ? null : subject.getName(), subject == null ? null : subject.getCode(),
                entry.getStaffId(), staff == null ? null : staff.getFullName(), entry.getRoom(), entry.getStatus());
    }
}
