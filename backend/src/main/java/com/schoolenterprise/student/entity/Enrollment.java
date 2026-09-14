package com.schoolenterprise.student.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "enrollment")
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "section_id")
    private Long sectionId;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    private String status = "ENROLLED";
    @Column(name = "enrolled_on")
    private LocalDate enrolledOn;
}
