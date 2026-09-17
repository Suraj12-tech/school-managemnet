package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "fee_head")
public class FeeHead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "school_id")
    private Long schoolId;
    private String name;
    private String code;
    private String description;
    @Column(nullable = false)
    private String status = "ACTIVE";
}
