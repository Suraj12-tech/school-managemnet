package com.schoolenterprise.student.dto;

import java.util.List;

public record PromotionPreview(
        Long fromAcademicYearId,
        Long toAcademicYearId,
        List<PromotionRow> rows
) {
}
