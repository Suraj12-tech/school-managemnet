package com.schoolenterprise.student.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "student_guardian")
@IdClass(StudentGuardianId.class)
public class StudentGuardian {
    @Id
    @Column(name = "student_id")
    private Long studentId;
    @Id
    @Column(name = "guardian_id")
    private Long guardianId;
    @Column(name = "is_primary")
    private boolean primaryGuardian;
}
