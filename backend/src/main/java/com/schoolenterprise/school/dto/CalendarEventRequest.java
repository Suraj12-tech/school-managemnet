package com.schoolenterprise.school.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CalendarEventRequest {
    @NotNull
    private Long academicYearId;

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Pattern(regexp = "SCHOOL_EVENT|HOLIDAY|EXAM|IMPORTANT_DATE|ACTIVITY|OTHER")
    private String eventType;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 1000)
    private String description;

    @Pattern(regexp = "ACTIVE|INACTIVE")
    private String status = "ACTIVE";
}
