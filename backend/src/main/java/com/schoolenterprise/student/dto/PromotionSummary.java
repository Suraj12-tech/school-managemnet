package com.schoolenterprise.student.dto;

public record PromotionSummary(
        int totalProcessed,
        int promoted,
        int notPromoted,
        int transferred,
        int left,
        int failed
) {
}
