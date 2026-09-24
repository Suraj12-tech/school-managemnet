package com.schoolenterprise.student.dto;

import java.util.List;

public record GuardianSummary(
        Long id,
        String fullName,
        String relationType,
        String phone,
        String email,
        long linkedStudentCount,
        String status,
        List<LinkedStudentResponse> students
) {
}
