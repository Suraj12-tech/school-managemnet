package com.schoolenterprise.academics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubjectRequest {
    @NotBlank(message = "Subject name is required")
    private String name;
    @NotBlank(message = "Subject code is required")
    private String code;
    @NotNull(message = "Department is required")
    private Long departmentId;
    private String description;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";
}
