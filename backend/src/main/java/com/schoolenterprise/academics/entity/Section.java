package com.schoolenterprise.academics.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "section")
public class Section {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "class_id")
    private Long classId;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    private String name;
    @Column(name = "class_teacher_staff_id")
    private Long classTeacherStaffId;
    @Column(nullable = false)
    private String status = "ACTIVE";
}
