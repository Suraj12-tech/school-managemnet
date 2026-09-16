package com.schoolenterprise.academics.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SectionRequest {
    @NotNull
    private Long classId;

    @NotNull
    private Long academicYearId;

    @NotBlank
    @Pattern(regexp = "[A-Z]", message = "section must be one uppercase letter")
    private String name;

    private Long classTeacherStaffId;

    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";
}
