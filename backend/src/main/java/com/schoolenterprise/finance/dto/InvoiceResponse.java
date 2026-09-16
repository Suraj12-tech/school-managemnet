package com.schoolenterprise.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long studentId;
    private String student;
    private Long feeStructureId;
    private String feeStructure;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstanding;
    private String status;
    private LocalDate issueDate;
    private LocalDate dueDate;
}
