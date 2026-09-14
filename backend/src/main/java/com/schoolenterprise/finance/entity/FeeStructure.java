package com.schoolenterprise.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "fee_structure")
public class FeeStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "class_id")
    private Long classId;
    private String category = "GENERAL";
    private String name;
}
