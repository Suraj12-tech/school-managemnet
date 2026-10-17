package com.schoolenterprise.teacher.service;

import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.TimetableEntryRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherPortalServiceTest {
    @Mock private PermissionService permissionService;
    @Mock private TeacherScopeResolver teacherScopeResolver;
    @Mock private AppUserRepository userRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private TeacherAssignmentRepository assignmentRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private TimetableEntryRepository timetableEntryRepository;
    @InjectMocks private TeacherPortalService teacherPortalService;

    @Test
    void rosterQueriesOnlyAssignedSectionsAndReturnsActiveStudentIdentityFields() {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope());
        Student inScope = student(41L, 31L, "ACTIVE");
        Student inactive = student(42L, 31L, "INACTIVE");
        Student otherSection = student(43L, 99L, "ACTIVE");
        when(studentRepository.findByCurrentSectionIdIn(List.of(31L)))
                .thenReturn(List.of(inScope, inactive, otherSection));

        List<TeacherPortalResponse.StudentRosterEntry> roster = teacherPortalService.students(31L);

        assertEquals(1, roster.size());
        assertEquals("STU-41", roster.get(0).studentIdentifier());
        assertEquals("Alex Example", roster.get(0).fullName());
        verify(studentRepository).findByCurrentSectionIdIn(List.of(31L));
    }

    @Test
    void otherTeachersStudentRecordReturnsNonDisclosingNotFound() {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope());
        when(studentRepository.findById(900L)).thenReturn(Optional.of(student(900L, 99L, "ACTIVE")));

        AppException error = assertThrows(AppException.class, () -> teacherPortalService.student(900L));

        assertEquals(404, error.getStatus().value());
    }

    @Test
    void twoTeachersCannotReadEachOthersStudentRecords() {
        AppUserDetails firstTeacher = new AppUserDetails(2L, "teacher-a", "x", true,
                Set.of("CLASS_TEACHER"), Set.of("students:view"), List.of());
        AppUserDetails secondTeacher = new AppUserDetails(3L, "teacher-b", "x", true,
                Set.of("SUBJECT_TEACHER"), Set.of("students:view"), List.of());
        when(permissionService.currentUser()).thenReturn(firstTeacher, secondTeacher);
        when(permissionService.isTeacher(firstTeacher)).thenReturn(true);
        when(permissionService.isTeacher(secondTeacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(firstTeacher)).thenReturn(
                new TeacherScope(10L, Set.of(100L), Set.of(20L), Set.of(31L), Set.of(), Set.of(40L)));
        when(teacherScopeResolver.resolve(secondTeacher)).thenReturn(
                new TeacherScope(11L, Set.of(101L), Set.of(21L), Set.of(32L), Set.of(), Set.of(41L)));
        when(studentRepository.findById(42L)).thenReturn(Optional.of(student(42L, 32L, "ACTIVE")));
        when(studentRepository.findById(41L)).thenReturn(Optional.of(student(41L, 31L, "ACTIVE")));

        assertEquals(404, assertThrows(AppException.class,
                () -> teacherPortalService.student(42L)).getStatus().value());
        assertEquals(404, assertThrows(AppException.class,
                () -> teacherPortalService.student(41L)).getStatus().value());
    }

    @Test
    void outOfScopeSectionDoesNotQueryStudentRoster() {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope());

        AppException error = assertThrows(AppException.class, () -> teacherPortalService.students(99L));

        assertEquals(404, error.getStatus().value());
        org.mockito.Mockito.verifyNoInteractions(studentRepository);
    }

    @Test
    void assignmentsListContainsOnlyTheTeachersCurrentValidActiveAssignments() {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope());
        when(assignmentRepository.findByStaffId(10L)).thenReturn(List.of(
                assignment(100L, 10L, "ACTIVE"),
                assignment(101L, 10L, "INACTIVE"),
                assignment(200L, 11L, "ACTIVE")));
        prepareAssignmentLabels();

        List<TeacherAssignmentResponse> results = teacherPortalService.assignments(null);

        assertEquals(1, results.size());
        assertEquals(100L, results.get(0).getId());
        assertEquals("Class 20", results.get(0).getClassName());
        assertEquals("Section A", results.get(0).getSectionName());
    }

    @Test
    void teacherCanReadDetailsForOwnActiveAssignment() {
        AppUserDetails teacher = teacher();
        TeacherAssignment assignment = assignment(100L, 10L, "ACTIVE");
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope());
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(assignment));
        prepareAssignmentLabels();

        TeacherAssignmentResponse result = teacherPortalService.assignment(100L);

        assertEquals(100L, result.getId());
        assertEquals(20L, result.getClassId());
        assertEquals(31L, result.getSectionId());
        assertEquals(40L, result.getAcademicYearId());
        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void twoTeachersCannotReadEachOthersAssignmentDetails() {
        AppUserDetails firstTeacher = new AppUserDetails(2L, "teacher-a", "x", true,
                Set.of("CLASS_TEACHER"), Set.of("classes:view"), List.of());
        AppUserDetails secondTeacher = new AppUserDetails(3L, "teacher-b", "x", true,
                Set.of("SUBJECT_TEACHER"), Set.of("classes:view"), List.of());
        when(permissionService.currentUser()).thenReturn(firstTeacher, secondTeacher);
        when(permissionService.isTeacher(firstTeacher)).thenReturn(true);
        when(permissionService.isTeacher(secondTeacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(firstTeacher)).thenReturn(scope());
        when(teacherScopeResolver.resolve(secondTeacher)).thenReturn(
                new TeacherScope(11L, Set.of(200L), Set.of(21L), Set.of(32L), Set.of(), Set.of(41L)));

        assertEquals(404, assertThrows(AppException.class,
                () -> teacherPortalService.assignment(200L)).getStatus().value());
        assertEquals(404, assertThrows(AppException.class,
                () -> teacherPortalService.assignment(100L)).getStatus().value());
        org.mockito.Mockito.verify(assignmentRepository, org.mockito.Mockito.never()).findById(100L);
        org.mockito.Mockito.verify(assignmentRepository, org.mockito.Mockito.never()).findById(200L);
    }

    @Test
    void nonTeacherCannotUseTeacherPortalEvenWithAnAssignedStaffLink() {
        AppUserDetails user = new AppUserDetails(2L, "staff", "x", true, Set.of("ADMIN"),
                Set.of(), List.of());
        when(permissionService.currentUser()).thenReturn(user);
        when(permissionService.isTeacher(user)).thenReturn(false);

        assertThrows(AppException.class, () -> teacherPortalService.profile());
        org.mockito.Mockito.verifyNoInteractions(teacherScopeResolver);
    }

    private AppUserDetails teacher() {
        return new AppUserDetails(2L, "teacher", "x", true, Set.of("CLASS_TEACHER"),
                Set.of("students:view"), List.of());
    }

    private TeacherScope scope() {
        return new TeacherScope(10L, Set.of(100L), Set.of(20L), Set.of(31L), Set.of(),
                Set.of(40L));
    }

    private TeacherAssignment assignment(Long id, Long staffId, String status) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(id);
        assignment.setStaffId(staffId);
        assignment.setAssignmentType("CLASS_TEACHER");
        assignment.setClassId(20L);
        assignment.setSectionId(31L);
        assignment.setAcademicYearId(40L);
        assignment.setStatus(status);
        return assignment;
    }

    private void prepareAssignmentLabels() {
        Staff staff = new Staff();
        staff.setFullName("Teacher One");
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setName("Class 20");
        Section section = new Section();
        section.setName("Section A");
        AcademicYear year = new AcademicYear();
        year.setName("Year 40");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year));
    }

    private Student student(Long id, Long sectionId, String status) {
        Student student = new Student();
        student.setId(id);
        student.setAdmissionNumber("STU-" + id);
        student.setFirstName("Alex");
        student.setLastName("Example");
        student.setStatus(status);
        student.setCurrentSectionId(sectionId);
        student.setEmail("private@example.test");
        student.setAddress("Private address");
        return student;
    }
}
