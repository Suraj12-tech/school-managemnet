package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuardianRequest {
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @NotBlank
    @Pattern(regexp = "FATHER|MOTHER|LEGAL_GUARDIAN|OTHER")
    private String relationType;

    @NotBlank
    @Pattern(regexp = "^\\+?[0-9 ()-]{7,20}$")
    private String phone;

    @NotBlank
    @Email
    @Size(max = 120)
    private String email;

    @NotBlank
    @Size(max = 255)
    private String address;

    @Size(max = 120)
    private String occupation;

    private boolean emergencyContact;

    @NotBlank
    @Pattern(regexp = "ACTIVE|INACTIVE")
    private String status = "ACTIVE";
}
