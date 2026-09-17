package com.schoolenterprise.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class FeeAccountResponse {
    private Long id;
    private Long studentId;
    private String student;
    private Long academicYearId;
    private String academicYear;
    private String className;
    private String section;
    private BigDecimal totalDue;
    private BigDecimal totalPaid;
    private BigDecimal concessionAmount;
    private BigDecimal outstanding;
    private String status;
    private List<Breakdown> breakdown;
    private List<PaymentHistory> payments;

    @Getter
    @Setter
    public static class Breakdown {
        private String feeHead;
        private BigDecimal due;
        private BigDecimal paid;
        private BigDecimal outstanding;
    }

    @Getter
    @Setter
    public static class PaymentHistory {
        private LocalDate date;
        private String receiptNumber;
        private BigDecimal amount;
        private String method;
        private String status;
    }
}
