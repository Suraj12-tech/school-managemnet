package com.schoolenterprise.school.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusRequest {
    @NotBlank
    @Pattern(regexp = "ACTIVE|INACTIVE|ARCHIVED")
    private String status;
}
