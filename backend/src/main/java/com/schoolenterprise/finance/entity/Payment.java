package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "invoice_id")
    private Long invoiceId;
    private BigDecimal amount;
    private String method;
    @Column(name = "paid_on")
    private LocalDate paidOn;
    @Column(name = "reference_no")
    private String referenceNo;
}
