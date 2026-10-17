package com.schoolenterprise.teacher.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SectionRepository;
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
import com.schoolenterprise.teacher.dto.TeacherReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TeacherReportsService {
    private final PermissionService permissionService;
    private final TeacherScopeResolver teacherScopeResolver;
    private final SectionRepository sectionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final TeacherPortalService teacherPortalService;
    private final AssessmentService assessmentService;

    @Transactional(readOnly = true)
    public TeacherReportResponse report(Long sectionId, LocalDate fromDate, LocalDate toDate) {
        AppUserDetails user = permissionService.currentUser();
        if (!permissionService.isTeacher(user)) {
            throw AppException.forbidden("Teacher reports access is required");
        }
        TeacherScope scope = teacherScopeResolver.resolve(user);
        if (!scope.sectionIds().contains(sectionId)) {
            throw AppException.notFound("Section not found");
        }
        if (fromDate.isAfter(toDate)) {
            throw AppException.badRequest("Report start date must be on or before the end date");
        }

        Section section = sectionRepository.findById(sectionId)
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (!scope.academicYearIds().contains(section.getAcademicYearId())) {
            throw AppException.notFound("Section not found");
        }
        AcademicYear year = academicYearRepository.findById(section.getAcademicYearId())
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (year.getStartDate() == null || year.getEndDate() == null
                || fromDate.isBefore(year.getStartDate()) || toDate.isAfter(year.getEndDate())
                || toDate.isAfter(LocalDate.now())) {
            throw AppException.badRequest("Report dates must be within the active academic year and not in the future");
        }

        TeacherReportResponse.AttendanceSummary attendance = attendanceSummary(sectionId, fromDate, toDate);
        List<TeacherReportResponse.AssignmentSummary> assignments = assignmentSummaries(
                teacherPortalService.assignments(null));
        List<com.schoolenterprise.assessment.dto.AssessmentResponse> publishedAssessments =
                assessmentService.teacherAssessments();
        return new TeacherReportResponse(attendance, assignments,
                new TeacherReportResponse.AssessmentOverview(publishedAssessments.size(), publishedAssessments));
    }

    private TeacherReportResponse.AttendanceSummary attendanceSummary(Long sectionId, LocalDate fromDate,
                                                                        LocalDate toDate) {
        long present = 0;
        long absent = 0;
        long late = 0;
        long total = 0;
        for (Object[] row : attendanceRecordRepository.summarizeBySectionAndDateRange(
                sectionId, fromDate, toDate)) {
            String status = ((String) row[0]).toUpperCase(Locale.ROOT);
            long count = ((Number) row[1]).longValue();
            total += count;
            switch (status) {
                case "PRESENT" -> present += count;
                case "ABSENT" -> absent += count;
                case "LATE" -> late += count;
                default -> { }
            }
        }
        return new TeacherReportResponse.AttendanceSummary(sectionId, fromDate, toDate,
                present, absent, late, total);
    }

    private List<TeacherReportResponse.AssignmentSummary> assignmentSummaries(
            List<TeacherAssignmentResponse> assignments) {
        Map<AssignmentKey, List<String>> grouped = new LinkedHashMap<>();
        Map<AssignmentKey, TeacherAssignmentResponse> representatives = new LinkedHashMap<>();
        for (TeacherAssignmentResponse assignment : assignments) {
            AssignmentKey key = new AssignmentKey(assignment.getClassId(), assignment.getSectionId(),
                    assignment.getSubjectId(), assignment.getAcademicYearId());
            representatives.putIfAbsent(key, assignment);
            List<String> types = grouped.computeIfAbsent(key, ignored -> new ArrayList<>());
            if (!types.contains(assignment.getAssignmentType())) {
                types.add(assignment.getAssignmentType());
            }
        }
        return grouped.entrySet().stream().map(entry -> {
            TeacherAssignmentResponse assignment = representatives.get(entry.getKey());
            return new TeacherReportResponse.AssignmentSummary(assignment.getClassId(),
                    assignment.getClassName(), assignment.getSectionId(), assignment.getSectionName(),
                    assignment.getSubjectId(), assignment.getSubjectName(), assignment.getAcademicYearId(),
                    assignment.getAcademicYearName(), List.copyOf(entry.getValue()));
        }).toList();
    }

    private record AssignmentKey(Long classId, Long sectionId, Long subjectId, Long academicYearId) {
    }
}
