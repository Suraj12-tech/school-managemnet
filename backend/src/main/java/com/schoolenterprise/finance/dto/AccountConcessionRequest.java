package com.schoolenterprise.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AccountConcessionRequest {
    @NotNull
    private Long studentId;
    @NotNull
    private Long academicYearId;
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;
    @NotBlank
    private String reason;
}
