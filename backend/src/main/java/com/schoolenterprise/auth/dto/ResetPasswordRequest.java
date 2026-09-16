package com.schoolenterprise.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {
    @NotBlank
    private String token;
    @NotBlank
    @Size(min = 8, message = "must be at least 8 characters")
    private String newPassword;
    @NotBlank
    private String confirmPassword;
}
