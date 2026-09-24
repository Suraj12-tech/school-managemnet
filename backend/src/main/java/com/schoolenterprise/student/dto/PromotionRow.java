package com.schoolenterprise.student.dto;

public record PromotionRow(
        Long studentId,
        String studentName,
        String admissionNumber,
        String currentClass,
        String currentSection,
        String newClass,
        String newSection,
        String status,
        String issue
) {
}
