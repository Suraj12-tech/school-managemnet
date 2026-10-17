package com.schoolenterprise.assessment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssessmentRequest(
        @NotBlank @Size(max = 150) String title,
        @NotNull Long classId,
        Long sectionId,
        @NotNull Long subjectId,
        @NotNull Long academicYearId,
        @NotNull LocalDate assessmentDate,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 6, fraction = 2) BigDecimal maxMarks,
        @NotBlank String status
) {
}
