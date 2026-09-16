package com.schoolenterprise.finance.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class FeeStructureResponse {
    private Long id;
    private String name;
    private String category;
    private Long academicYearId;
    private String academicYear;
    private Long classId;
    private String className;
    private String status;
    private BigDecimal totalAmount;
    private List<Item> items;

    @Getter
    @Setter
    public static class Item {
        private Long id;
        private Long feeHeadId;
        private String feeHead;
        private BigDecimal amount;
    }
}
