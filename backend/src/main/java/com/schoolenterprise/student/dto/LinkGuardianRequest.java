package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkGuardianRequest {
    @NotNull
    private Long guardianId;

    @NotBlank
    @Pattern(regexp = "FATHER|MOTHER|LEGAL_GUARDIAN|OTHER")
    private String relationshipType;

    private boolean primaryGuardian;
    private boolean emergencyContact;
}
