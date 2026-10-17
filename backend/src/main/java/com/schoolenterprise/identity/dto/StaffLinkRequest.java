package com.schoolenterprise.identity.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffLinkRequest {
    @NotNull
    @Positive
    private Long staffId;
}
