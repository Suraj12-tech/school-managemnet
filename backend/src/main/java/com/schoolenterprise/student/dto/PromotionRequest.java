package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PromotionRequest {
    @NotNull @Positive
    private Long fromAcademicYearId;
    @NotNull @Positive
    private Long toAcademicYearId;
    @NotNull @Positive
    private Long sourceClassId;
    private List<Long> studentIds;
    private List<PromotionDecision> decisions;
}
