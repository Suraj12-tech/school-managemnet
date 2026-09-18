package com.schoolenterprise.finance.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PayrollRequest {
    @NotNull
    private Long staffId;
    @NotBlank
    @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])", message = "Pay period must use YYYY-MM format")
    private String payPeriod;
    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal basicSalary;
    @DecimalMin(value = "0.00")
    private BigDecimal allowances = BigDecimal.ZERO;
    @DecimalMin(value = "0.00")
    private BigDecimal deductions = BigDecimal.ZERO;
    private String status = "PENDING";
    private LocalDate paymentDate;
    private String paymentMethod;
    private String referenceNo;
}
