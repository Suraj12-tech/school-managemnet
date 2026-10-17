package com.schoolenterprise.teacher.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.assessment.dto.AssessmentResponse;
import com.schoolenterprise.assessment.service.AssessmentService;
import com.schoolenterprise.attendance.repository.AttendanceRecordRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.dto.TeacherAssignmentResponse;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.teacher.dto.TeacherReportResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherReportsServiceTest {
    private final LocalDate today = LocalDate.now();

    @Mock private PermissionService permissionService;
    @Mock private TeacherScopeResolver teacherScopeResolver;
    @Mock private SectionRepository sectionRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @Mock private TeacherPortalService teacherPortalService;
    @Mock private AssessmentService assessmentService;
    @InjectMocks private TeacherReportsService service;

    @Test
    void reportAggregatesInclusiveRangeAndSummarizesOnlyAuthorizedTeacherData() {
        LocalDate from = today.minusDays(7);
        LocalDate to = today;
        prepareAuthorizedReport(from.minusDays(1), to.plusDays(1));
        when(attendanceRecordRepository.summarizeBySectionAndDateRange(9L, from, to)).thenReturn(List.of(
                new Object[]{"PRESENT", 5L},
                new Object[]{"ABSENT", 2L},
                new Object[]{"LATE", 1L}));
        when(teacherPortalService.assignments(null)).thenReturn(List.of(
                assignment(5L, 9L, 30L, 40L, "CLASS_TEACHER"),
                assignment(5L, 9L, 30L, 40L, "SUBJECT_TEACHER")));
        AssessmentResponse published = new AssessmentResponse(51L, "Unit test", 5L, "Class 5",
                9L, "Section 9", 30L, "Science", 40L, "Year 40", today,
                BigDecimal.TEN, "PUBLISHED");
        when(assessmentService.teacherAssessments()).thenReturn(List.of(published));

        TeacherReportResponse report = service.report(9L, from, to);

        assertEquals(5L, report.attendance().present());
        assertEquals(2L, report.attendance().absent());
        assertEquals(1L, report.attendance().late());
        assertEquals(8L, report.attendance().totalRecorded());
        assertEquals(from, report.attendance().fromDate());
        assertEquals(to, report.attendance().toDate());
        assertEquals(1, report.assignments().size());
        assertEquals(List.of("CLASS_TEACHER", "SUBJECT_TEACHER"), report.assignments().get(0).assignmentTypes());
        assertEquals(1, report.assessments().publishedCount());
        assertEquals(List.of(published), report.assessments().publishedAssessments());
        verify(attendanceRecordRepository).summarizeBySectionAndDateRange(9L, from, to);
    }

    @Test
    void emptyAttendanceAndOtherReportResultsAreReturnedAsEmptySummaries() {
        prepareAuthorizedReport(today.minusDays(1), today);
        when(attendanceRecordRepository.summarizeBySectionAndDateRange(9L, today, today)).thenReturn(List.of());
        when(teacherPortalService.assignments(null)).thenReturn(List.of());
        when(assessmentService.teacherAssessments()).thenReturn(List.of());

        TeacherReportResponse report = service.report(9L, today, today);

        assertEquals(0L, report.attendance().totalRecorded());
        assertEquals(0L, report.attendance().present());
        assertEquals(List.of(), report.assignments());
        assertEquals(0L, report.assessments().publishedCount());
        assertEquals(List.of(), report.assessments().publishedAssessments());
    }

    @Test
    void rejectsReversedOrOutOfAcademicYearDateRanges() {
        prepareAuthorizedReport(today.minusDays(10), today.plusDays(1));

        assertEquals(400, assertThrows(AppException.class,
                () -> service.report(9L, today, today.minusDays(1))).getStatus().value());
        assertEquals(400, assertThrows(AppException.class,
                () -> service.report(9L, today.minusDays(11), today)).getStatus().value());
        assertEquals(400, assertThrows(AppException.class,
                () -> service.report(9L, today, today.plusDays(1))).getStatus().value());
        verify(attendanceRecordRepository, never()).summarizeBySectionAndDateRange(9L, today, today);
    }

    @Test
    void anotherTeacherCannotReadSectionAttendanceReport() {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(
                new TeacherScope(8L, Set.of(101L), Set.of(6L), Set.of(10L), Set.of(31L), Set.of(41L)));

        assertEquals(404, assertThrows(AppException.class,
                () -> service.report(9L, today, today)).getStatus().value());
        verify(attendanceRecordRepository, never()).summarizeBySectionAndDateRange(9L, today, today);
        verify(teacherPortalService, never()).assignments(null);
        verify(assessmentService, never()).teacherAssessments();
    }

    private void prepareAuthorizedReport(LocalDate yearStart, LocalDate yearEnd) {
        AppUserDetails teacher = teacher();
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(
                new TeacherScope(7L, Set.of(100L), Set.of(5L), Set.of(9L), Set.of(30L), Set.of(40L)));
        Section section = new Section();
        section.setId(9L);
        section.setClassId(5L);
        section.setAcademicYearId(40L);
        section.setStatus("ACTIVE");
        when(sectionRepository.findById(9L)).thenReturn(java.util.Optional.of(section));
        AcademicYear year = new AcademicYear();
        year.setId(40L);
        year.setStartDate(yearStart);
        year.setEndDate(yearEnd);
        year.setStatus("ACTIVE");
        when(academicYearRepository.findById(40L)).thenReturn(java.util.Optional.of(year));
    }

    private AppUserDetails teacher() {
        return new AppUserDetails(2L, "teacher", "x", true,
                Set.of("CLASS_TEACHER"), Set.of("students:view"), List.of());
    }

    private TeacherAssignmentResponse assignment(Long classId, Long sectionId, Long subjectId,
                                                   Long yearId, String type) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(100L);
        assignment.setStaffId(7L);
        assignment.setClassId(classId);
        assignment.setSectionId(sectionId);
        assignment.setSubjectId(subjectId);
        assignment.setAcademicYearId(yearId);
        assignment.setAssignmentType(type);
        assignment.setStatus("ACTIVE");
        return new TeacherAssignmentResponse(assignment, "Teacher", "Science", "Class 5",
                "Section 9", "Year 40");
    }
}
