package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "payroll_record", uniqueConstraints = @UniqueConstraint(
        name = "uk_payroll_staff_period", columnNames = {"staff_id", "pay_period"}))
public class PayrollRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "staff_id", nullable = false)
    private Long staffId;
    @Column(name = "pay_period", nullable = false, length = 7)
    private String payPeriod;
    @Column(name = "basic_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal allowances = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deductions = BigDecimal.ZERO;
    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;
    private String status = "PENDING";
    @Column(name = "payment_date")
    private LocalDate paymentDate;
    @Column(name = "payment_method")
    private String paymentMethod;
    @Column(name = "reference_no")
    private String referenceNo;
}
