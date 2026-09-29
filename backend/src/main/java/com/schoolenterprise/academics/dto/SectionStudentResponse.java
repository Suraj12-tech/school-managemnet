package com.schoolenterprise.academics.dto;

public record SectionStudentResponse(
        Long id,
        String admissionNumber,
        String firstName,
        String lastName,
        String dateOfBirth,
        String gender,
        String email,
        String phone,
        String status,
        Long classId,
        String className,
        Long sectionId,
        String sectionName,
        Long academicYearId,
        String academicYearName,
        String enrollmentStatus
) {
}
