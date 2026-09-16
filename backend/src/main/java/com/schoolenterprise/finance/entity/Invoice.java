package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "invoice")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "fee_structure_id")
    private Long feeStructureId;
    @Column(name = "invoice_number")
    private String invoiceNumber;
    @Column(name = "issue_date")
    private LocalDate issueDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    private String status = "UNPAID";
}
