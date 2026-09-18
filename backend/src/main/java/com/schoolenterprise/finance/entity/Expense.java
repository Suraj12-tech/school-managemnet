package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "expense")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "school_id", nullable = false)
    private Long schoolId;
    private String title;
    private String category;
    private BigDecimal amount;
    @Column(name = "expense_date")
    private LocalDate expenseDate;
    private String description;
    private String status = "PENDING";
    @Column(name = "payment_method")
    private String paymentMethod;
    @Column(name = "reference_no")
    private String referenceNo;
}
