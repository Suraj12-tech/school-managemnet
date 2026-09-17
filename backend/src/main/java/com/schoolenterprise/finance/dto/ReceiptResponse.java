package com.schoolenterprise.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ReceiptResponse {
    private Long id;
    private String receiptNumber;
    private LocalDate paymentDate;
    private LocalDate issuedOn;
    private String invoiceNumber;
    private String student;
    private BigDecimal amount;
    private String paymentMethod;
    private Long paymentId;
}
