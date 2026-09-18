package com.schoolenterprise.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PayrollResponse {
    private Long id;
    private Long staffId;
    private String employeeId;
    private String staffName;
    private String designation;
    private String payPeriod;
    private BigDecimal basicSalary;
    private BigDecimal allowances;
    private BigDecimal deductions;
    private BigDecimal netSalary;
    private String status;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String referenceNo;
}
