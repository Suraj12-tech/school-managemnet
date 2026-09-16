package com.schoolenterprise.student.dto;

public record GuardianSummary(
        Long id,
        String fullName,
        String relationType,
        String phone,
        String email,
        long linkedStudentCount,
        String status
) {
}
