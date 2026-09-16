package com.schoolenterprise.academics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "subject")
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "school_id")
    private Long schoolId;
    @Column(name = "department_id")
    private Long departmentId;
    private String name;
    private String code;
    private String description;
    @Column(nullable = false)
    private String status = "ACTIVE";
}
