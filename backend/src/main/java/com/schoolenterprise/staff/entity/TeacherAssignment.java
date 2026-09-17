package com.schoolenterprise.staff.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "teacher_assignment")
public class TeacherAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "staff_id")
    private Long staffId;
    @Column(name = "subject_id")
    private Long subjectId;
    @Column(name = "class_id")
    private Long classId;
    @Column(name = "section_id")
    private Long sectionId;
    @Column(name = "academic_year_id")
    private Long academicYearId;
}
