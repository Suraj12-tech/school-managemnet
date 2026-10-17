package com.schoolenterprise.attendance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record TeacherAttendanceRequest(
        @NotNull Long sectionId,
        @NotNull LocalDate date,
        @NotEmpty List<@Valid AttendanceMarkRequest> records
) {
}
