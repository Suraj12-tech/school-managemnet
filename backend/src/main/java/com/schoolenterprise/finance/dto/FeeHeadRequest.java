package com.schoolenterprise.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeeHeadRequest {
    @NotBlank @Size(max = 120)
    private String name;
    @NotBlank @Size(max = 30)
    private String code;
    @Size(max = 255)
    private String description;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";
}
