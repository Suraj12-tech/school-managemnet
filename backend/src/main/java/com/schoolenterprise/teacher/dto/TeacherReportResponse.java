package com.schoolenterprise.teacher.dto;

import com.schoolenterprise.assessment.dto.AssessmentResponse;

import java.time.LocalDate;
import java.util.List;

public record TeacherReportResponse(
        AttendanceSummary attendance,
        List<AssignmentSummary> assignments,
        AssessmentOverview assessments
) {
    public record AttendanceSummary(
            Long sectionId,
            LocalDate fromDate,
            LocalDate toDate,
            long present,
            long absent,
            long late,
            long totalRecorded
    ) {
    }

    public record AssignmentSummary(
            Long classId,
            String className,
            Long sectionId,
            String sectionName,
            Long subjectId,
            String subjectName,
            Long academicYearId,
            String academicYearName,
            List<String> assignmentTypes
    ) {
    }

    public record AssessmentOverview(long publishedCount, List<AssessmentResponse> publishedAssessments) {
    }
}
