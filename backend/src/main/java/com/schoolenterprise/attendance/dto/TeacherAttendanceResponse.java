package com.schoolenterprise.attendance.dto;

import java.time.LocalDate;
import java.util.List;

public record TeacherAttendanceResponse(
        Long sectionId,
        LocalDate date,
        boolean canManageAttendance,
        List<AttendanceEntry> records
) {
    public record AttendanceEntry(String studentIdentifier, String fullName, String status) {
    }
}
