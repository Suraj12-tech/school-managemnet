package com.schoolenterprise.academics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "department")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "school_id")
    private Long schoolId;
    private String name;
    private String description;
    @Column(nullable = false)
    private String status = "ACTIVE";
    private String code;
}
