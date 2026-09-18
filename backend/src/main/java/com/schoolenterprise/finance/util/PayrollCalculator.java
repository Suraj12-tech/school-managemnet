package com.schoolenterprise.finance.util;

import com.schoolenterprise.common.exception.AppException;

import java.math.BigDecimal;

public final class PayrollCalculator {
    private PayrollCalculator() {}

    public static BigDecimal net(BigDecimal basicSalary, BigDecimal allowances, BigDecimal deductions) {
        if (basicSalary == null || basicSalary.signum() < 0
                || allowances == null || allowances.signum() < 0
                || deductions == null || deductions.signum() < 0) {
            throw AppException.badRequest("Salary values cannot be negative");
        }
        BigDecimal net = basicSalary.add(allowances).subtract(deductions);
        if (net.signum() < 0) {
            throw AppException.badRequest("Deductions cannot exceed gross salary");
        }
        return net;
    }
}
