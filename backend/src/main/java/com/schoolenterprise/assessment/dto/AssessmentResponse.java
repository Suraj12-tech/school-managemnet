package com.schoolenterprise.assessment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssessmentResponse(
        Long id,
        String title,
        Long classId,
        String className,
        Long sectionId,
        String sectionName,
        Long subjectId,
        String subjectName,
        Long academicYearId,
        String academicYearName,
        LocalDate assessmentDate,
        BigDecimal maxMarks,
        String status
) {
}
