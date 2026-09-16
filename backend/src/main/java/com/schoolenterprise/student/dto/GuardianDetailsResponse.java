package com.schoolenterprise.student.dto;

import java.util.List;

public record GuardianDetailsResponse(
        Long id,
        String fullName,
        String relationType,
        String phone,
        String email,
        String address,
        String occupation,
        boolean emergencyContact,
        String status,
        List<LinkedStudentResponse> students
) {
}
