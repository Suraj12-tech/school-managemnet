package com.schoolenterprise.finance.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ExpenseRequest {
    @NotBlank
    @Size(max = 150)
    private String title;
    @NotBlank
    @Size(max = 80)
    private String category;
    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;
    @NotNull
    private LocalDate expenseDate;
    @Size(max = 500)
    private String description;
    private String status = "PENDING";
    private String paymentMethod;
    private String referenceNo;
}
