package com.schoolenterprise.teacher.dto;

public final class TeacherPortalResponse {
    private TeacherPortalResponse() {
    }

    public record Profile(
            Long userId,
            Long staffId,
            String employeeId,
            String fullName,
            String email,
            String phone
    ) {
    }

    public record SchoolClassView(Long id, Long schoolId, String name, Integer numberOfClassrooms) {
    }

    public record SectionView(Long id, String name, Long classId, Long academicYearId, String status) {
    }

    public record SubjectView(Long id, Long schoolId, String name, String code, String description) {
    }

    public record AcademicYearView(Long id, String name, String status, boolean currentYear) {
    }

    public record StudentRosterEntry(String studentIdentifier, String fullName) {
    }
}
