package com.schoolenterprise.finance.util;

import com.schoolenterprise.common.exception.AppException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PayrollCalculatorTest {
    @Test
    void calculatesNetSalaryFromBasicAllowancesAndDeductions() {
        assertEquals(new BigDecimal("1100.00"),
                PayrollCalculator.net(new BigDecimal("1000.00"), new BigDecimal("200.00"), new BigDecimal("100.00")));
    }

    @Test
    void rejectsDeductionsAboveGrossSalary() {
        assertThrows(AppException.class, () ->
                PayrollCalculator.net(new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("101.00")));
    }
}
