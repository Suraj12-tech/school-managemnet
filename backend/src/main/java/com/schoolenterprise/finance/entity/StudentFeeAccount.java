package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "student_fee_account")
public class StudentFeeAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "total_due")
    private BigDecimal totalDue = BigDecimal.ZERO;
    @Column(name = "total_paid")
    private BigDecimal totalPaid = BigDecimal.ZERO;
    @Column(name = "concession_amount")
    private BigDecimal concessionAmount = BigDecimal.ZERO;
    private BigDecimal outstanding = BigDecimal.ZERO;
}
