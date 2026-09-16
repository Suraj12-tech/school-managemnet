package com.schoolenterprise.student.dto;

public record LinkedStudentResponse(
        Long studentId,
        String studentName,
        String admissionNumber,
        String className,
        String sectionName,
        String relationshipType,
        boolean primaryGuardian,
        boolean emergencyContact
) {
}
