package com.schoolenterprise.finance.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FeeCalculatorTest {

    @Test
    void outstandingSubtractsPaymentsAndConcessions() {
        BigDecimal result = FeeCalculator.outstanding(
                new BigDecimal("10000"),
                new BigDecimal("4000"),
                new BigDecimal("1000"));
        assertEquals(new BigDecimal("5000"), result);
    }

    @Test
    void outstandingNeverGoesNegative() {
        BigDecimal result = FeeCalculator.outstanding(
                new BigDecimal("1000"),
                new BigDecimal("900"),
                new BigDecimal("200"));
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void invoiceStatusMatchesPaidAmount() {
        assertEquals("UNPAID", FeeCalculator.invoiceStatus(new BigDecimal("500"), BigDecimal.ZERO));
        assertEquals("PARTIAL", FeeCalculator.invoiceStatus(new BigDecimal("500"), new BigDecimal("200")));
        assertEquals("PAID", FeeCalculator.invoiceStatus(new BigDecimal("500"), new BigDecimal("500")));
    }
}
