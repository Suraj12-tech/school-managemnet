package com.schoolenterprise.student.dto;

public record StudentGuardianResponse(
        Long studentId,
        Long guardianId,
        String relationshipType,
        boolean primaryGuardian,
        boolean emergencyContact
) {
}
