package com.schoolenterprise.finance.util;

import java.math.BigDecimal;

/** Tiny helper so the balance formula is easy to read and test. */
public final class FeeCalculator {

    private FeeCalculator() {
    }

    public static BigDecimal outstanding(BigDecimal totalDue, BigDecimal totalPaid, BigDecimal concession) {
        BigDecimal due = n(totalDue);
        BigDecimal paid = n(totalPaid);
        BigDecimal conc = n(concession);
        BigDecimal value = due.subtract(paid).subtract(conc);
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    public static String invoiceStatus(BigDecimal invoiceTotal, BigDecimal paidOnInvoice) {
        if (n(paidOnInvoice).compareTo(BigDecimal.ZERO) == 0) {
            return "UNPAID";
        }
        if (n(paidOnInvoice).compareTo(n(invoiceTotal)) >= 0) {
            return "PAID";
        }
        return "PARTIAL";
    }

    private static BigDecimal n(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
