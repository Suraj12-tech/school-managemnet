package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record PromotionDecision(
        @NotNull @Positive Long studentId,
        @NotNull @Pattern(regexp = "PROMOTED|NOT_PROMOTED|TRANSFERRED|LEFT") String status,
        Long targetClassId,
        Long targetSectionId
) {
}
