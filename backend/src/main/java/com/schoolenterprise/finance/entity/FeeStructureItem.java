package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "fee_structure_item")
public class FeeStructureItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "fee_structure_id")
    private Long feeStructureId;
    @Column(name = "fee_head_id")
    private Long feeHeadId;
    private BigDecimal amount;
}
