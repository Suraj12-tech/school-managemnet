package com.schoolenterprise.attendance.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.attendance.dto.AttendanceMarkRequest;
import com.schoolenterprise.attendance.dto.TeacherAttendanceRequest;
import com.schoolenterprise.attendance.entity.AttendanceRecord;
import com.schoolenterprise.attendance.repository.AttendanceRecordRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherAttendanceServiceTest {
    private static final LocalDate DATE = LocalDate.now().minusDays(1);

    @Mock private PermissionService permissionService;
    @Mock private TeacherScopeResolver teacherScopeResolver;
    @Mock private SectionRepository sectionRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @InjectMocks private TeacherAttendanceService service;

    @Test
    void teacherReadsRosterAndExistingAttendanceOnlyForAssignedSection() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        Student student = student(21L, "ST-21", 9L, "ACTIVE");
        AttendanceRecord saved = savedRecord(21L, 9L, 11L, "PRESENT");
        when(studentRepository.findByCurrentSectionIdIn(List.of(9L))).thenReturn(List.of(student));
        when(attendanceRecordRepository.findBySectionIdAndAttendanceDate(9L, DATE)).thenReturn(List.of(saved));

        var result = service.attendance(9L, DATE);

        assertEquals(9L, result.sectionId());
        org.junit.jupiter.api.Assertions.assertTrue(result.canManageAttendance());
        assertEquals("ST-21", result.records().get(0).studentIdentifier());
        assertEquals("Example Student", result.records().get(0).fullName());
        assertEquals("PRESENT", result.records().get(0).status());
    }

    @Test
    void anotherTeacherCannotReadOrWriteTheAssignedTeachersSection() {
        prepareTeacher("teacher-b", scope(8L, 10L, 12L));

        AppException error = assertThrows(AppException.class, () -> service.attendance(9L, DATE));
        assertEquals(404, error.getStatus().value());
        assertThrows(AppException.class, () -> service.save(request(9L, "ST-21", "PRESENT")));
        verify(sectionRepository, never()).findById(any());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void teacherCanMarkAttendanceWithServerDerivedStaffIdentity() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        Student student = student(21L, "ST-21", 9L, "ACTIVE");
        when(studentRepository.findByAdmissionNumber("ST-21")).thenReturn(Optional.of(student));
        when(studentRepository.findByCurrentSectionIdIn(List.of(9L))).thenReturn(List.of(student));
        when(attendanceRecordRepository.findByStudentIdAndAttendanceDate(21L, DATE))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.findBySectionIdAndAttendanceDate(9L, DATE)).thenReturn(List.of());
        when(attendanceRecordRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.save(request(9L, "ST-21", "LATE"));

        verify(attendanceRecordRepository).saveAll(argThat(savedRecords -> {
            var iterator = savedRecords.iterator();
            if (!iterator.hasNext()) return false;
            AttendanceRecord saved = iterator.next();
            return !iterator.hasNext()
                    && Long.valueOf(7L).equals(saved.getMarkedByStaffId())
                    && Long.valueOf(11L).equals(saved.getAcademicYearId())
                    && "LATE".equals(saved.getStatus());
        }));
    }

    @Test
    void teacherUpdatesExistingAttendanceInsteadOfCreatingADuplicate() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        Student student = student(21L, "ST-21", 9L, "ACTIVE");
        AttendanceRecord existing = savedRecord(21L, 9L, 11L, "PRESENT");
        existing.setId(501L);
        when(studentRepository.findByAdmissionNumber("ST-21")).thenReturn(Optional.of(student));
        when(studentRepository.findByCurrentSectionIdIn(List.of(9L))).thenReturn(List.of(student));
        when(attendanceRecordRepository.findByStudentIdAndAttendanceDate(21L, DATE))
                .thenReturn(Optional.of(existing));
        when(attendanceRecordRepository.findBySectionIdAndAttendanceDate(9L, DATE))
                .thenReturn(List.of(existing));
        when(attendanceRecordRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.save(request(9L, "ST-21", "ABSENT"));

        assertEquals(501L, existing.getId());
        assertEquals("ABSENT", existing.getStatus());
        assertEquals("ABSENT", result.records().get(0).status());
        verify(attendanceRecordRepository).saveAll(List.of(existing));
    }

    @Test
    void rejectsStudentOutsideSectionWithoutSavingAnyAttendance() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        when(studentRepository.findByAdmissionNumber("ST-99"))
                .thenReturn(Optional.of(student(99L, "ST-99", 10L, "ACTIVE")));

        AppException error = assertThrows(AppException.class,
                () -> service.save(request(9L, "ST-99", "PRESENT")));

        assertEquals(404, error.getStatus().value());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void rejectsInactiveStudentWithoutSavingAnyAttendance() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        when(studentRepository.findByAdmissionNumber("ST-21"))
                .thenReturn(Optional.of(student(21L, "ST-21", 9L, "INACTIVE")));

        AppException error = assertThrows(AppException.class,
                () -> service.save(request(9L, "ST-21", "PRESENT")));

        assertEquals(404, error.getStatus().value());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void cannotOverwriteSameStudentDateAttendanceFromAnotherSection() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        Student student = student(21L, "ST-21", 9L, "ACTIVE");
        AttendanceRecord existing = savedRecord(21L, 10L, 12L, "PRESENT");
        existing.setId(501L);
        when(studentRepository.findByAdmissionNumber("ST-21")).thenReturn(Optional.of(student));
        when(attendanceRecordRepository.findByStudentIdAndAttendanceDate(21L, DATE))
                .thenReturn(Optional.of(existing));

        AppException error = assertThrows(AppException.class,
                () -> service.save(request(9L, "ST-21", "ABSENT")));

        assertEquals(409, error.getStatus().value());
        assertEquals("PRESENT", existing.getStatus());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void subjectTeacherCanReadAssignedSectionButCannotManageAttendance() {
        AppUserDetails teacher = new AppUserDetails(2L, "subject-teacher", "x", true,
                Set.of("SUBJECT_TEACHER"), Set.of("students:view"), List.of());
        TeacherScope scope = scope(7L, 9L, 11L);
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope);
        TeacherAssignment subjectAssignment = assignment(100L, 7L, 9L, "SUBJECT_TEACHER");
        when(teacherAssignmentRepository.findByStaffId(7L)).thenReturn(List.of(subjectAssignment));
        prepareActiveSectionAndYear();
        when(studentRepository.findByCurrentSectionIdIn(List.of(9L))).thenReturn(List.of());
        when(attendanceRecordRepository.findBySectionIdAndAttendanceDate(9L, DATE)).thenReturn(List.of());

        var attendance = service.attendance(9L, DATE);
        assertFalse(attendance.canManageAttendance());
        AppException error = assertThrows(AppException.class,
                () -> service.save(request(9L, "ST-21", "PRESENT")));

        assertEquals(403, error.getStatus().value());
        verify(studentRepository, never()).findByAdmissionNumber(any());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void rejectsDuplicateStudentAndInvalidStatusWithoutSaving() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();
        when(studentRepository.findByAdmissionNumber("ST-21"))
                .thenReturn(Optional.of(student(21L, "ST-21", 9L, "ACTIVE")));
        TeacherAttendanceRequest duplicate = new TeacherAttendanceRequest(9L, DATE, List.of(
                new AttendanceMarkRequest("ST-21", "PRESENT"),
                new AttendanceMarkRequest("st-21", "ABSENT")));

        assertEquals(400, assertThrows(AppException.class, () -> service.save(duplicate)).getStatus().value());
        assertEquals(400, assertThrows(AppException.class,
                () -> service.save(request(9L, "ST-21", "UNKNOWN"))).getStatus().value());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void rejectsDateOutsideActiveAcademicYearWithoutSaving() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();

        AppException error = assertThrows(AppException.class, () -> service.save(
                new TeacherAttendanceRequest(9L, LocalDate.now().minusYears(2),
                        List.of(new AttendanceMarkRequest("ST-21", "PRESENT")))));

        assertEquals(400, error.getStatus().value());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void rejectsFutureAttendanceDateWithoutSaving() {
        prepareTeacher("teacher-a", scope(7L, 9L, 11L));
        prepareActiveSectionAndYear();

        AppException error = assertThrows(AppException.class, () -> service.save(
                new TeacherAttendanceRequest(9L, LocalDate.now().plusDays(1),
                        List.of(new AttendanceMarkRequest("ST-21", "PRESENT")))));

        assertEquals(400, error.getStatus().value());
        verify(attendanceRecordRepository, never()).saveAll(any());
    }

    @Test
    void nonTeacherCannotUseAttendanceEndpoints() {
        AppUserDetails admin = new AppUserDetails(2L, "admin", "x", true, Set.of("ADMIN"),
                Set.of("students:view"), List.of());
        when(permissionService.currentUser()).thenReturn(admin);
        when(permissionService.isTeacher(admin)).thenReturn(false);

        assertEquals(403, assertThrows(AppException.class, () -> service.attendance(9L, DATE))
                .getStatus().value());
        verify(teacherScopeResolver, never()).resolve(any());
    }

    private void prepareTeacher(String username, TeacherScope scope) {
        AppUserDetails teacher = new AppUserDetails(2L, username, "x", true,
                Set.of("CLASS_TEACHER"), Set.of("students:view"), List.of());
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope);
        lenient().when(teacherAssignmentRepository.findByStaffId(scope.staffId()))
                .thenReturn(List.of(assignment(scope.assignmentIds().iterator().next(), scope.staffId(),
                        scope.sectionIds().iterator().next(), "CLASS_TEACHER")));
    }

    private void prepareActiveSectionAndYear() {
        Section section = new Section();
        section.setId(9L);
        section.setClassId(5L);
        section.setAcademicYearId(11L);
        section.setStatus("ACTIVE");
        AcademicYear year = new AcademicYear();
        year.setId(11L);
        year.setStatus("ACTIVE");
        year.setStartDate(LocalDate.now().minusYears(1));
        year.setEndDate(LocalDate.now().plusYears(1));
        when(sectionRepository.findById(9L)).thenReturn(Optional.of(section));
        when(academicYearRepository.findById(11L)).thenReturn(Optional.of(year));
    }

    private TeacherScope scope(Long staffId, Long sectionId, Long yearId) {
        return new TeacherScope(staffId, Set.of(100L), Set.of(5L), Set.of(sectionId),
                Set.of(), Set.of(yearId));
    }

    private TeacherAttendanceRequest request(Long sectionId, String identifier, String status) {
        return new TeacherAttendanceRequest(sectionId, DATE,
                List.of(new AttendanceMarkRequest(identifier, status)));
    }

    private Student student(Long id, String identifier, Long sectionId, String status) {
        Student student = new Student();
        student.setId(id);
        student.setAdmissionNumber(identifier);
        student.setFirstName("Example");
        student.setLastName("Student");
        student.setCurrentSectionId(sectionId);
        student.setStatus(status);
        return student;
    }

    private AttendanceRecord savedRecord(Long studentId, Long sectionId, Long yearId, String status) {
        AttendanceRecord record = new AttendanceRecord();
        record.setStudentId(studentId);
        record.setSectionId(sectionId);
        record.setAcademicYearId(yearId);
        record.setAttendanceDate(DATE);
        record.setStatus(status);
        return record;
    }

    private TeacherAssignment assignment(Long id, Long staffId, Long sectionId, String type) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(id);
        assignment.setStaffId(staffId);
        assignment.setSectionId(sectionId);
        assignment.setAssignmentType(type);
        assignment.setStatus("ACTIVE");
        return assignment;
    }
}
