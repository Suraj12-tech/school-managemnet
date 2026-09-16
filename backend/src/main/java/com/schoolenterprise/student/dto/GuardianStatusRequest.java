package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuardianStatusRequest {
    @NotBlank
    @Pattern(regexp = "ACTIVE|INACTIVE")
    private String status;
}
