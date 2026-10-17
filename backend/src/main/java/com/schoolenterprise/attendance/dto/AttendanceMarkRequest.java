package com.schoolenterprise.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record AttendanceMarkRequest(
        @NotBlank String studentIdentifier,
        @NotBlank String status
) {
}
