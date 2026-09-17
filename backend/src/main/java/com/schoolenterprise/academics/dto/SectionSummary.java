package com.schoolenterprise.academics.dto;

public record SectionSummary(
        Long id,
        String name,
        Long classId,
        String className,
        Long academicYearId,
        String academicYearName,
        Long classTeacherStaffId,
        String classTeacherName,
        long studentCount,
        String status
) {
}
