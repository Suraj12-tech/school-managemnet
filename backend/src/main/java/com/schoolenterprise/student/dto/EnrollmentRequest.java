package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnrollmentRequest {
    @NotNull @Positive
    private Long studentId;
    @NotNull @Positive
    private Long academicYearId;
    @NotNull @Positive
    private Long classId;
    @NotNull @Positive
    private Long sectionId;
}
