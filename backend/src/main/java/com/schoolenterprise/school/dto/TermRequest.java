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
public class TermRequest {
    @NotNull
    private Long academicYearId;

    @NotBlank
    @Size(max = 50)
    private String name;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @Pattern(regexp = "ACTIVE|INACTIVE")
    private String status = "ACTIVE";
}
