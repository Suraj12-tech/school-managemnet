package com.schoolenterprise.academics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "school_class")
public class SchoolClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "school_id")
    private Long schoolId;
    private String name;
    @Column(name = "number_of_classrooms", nullable = false)
    private Integer numberOfClassrooms = 1;
}
