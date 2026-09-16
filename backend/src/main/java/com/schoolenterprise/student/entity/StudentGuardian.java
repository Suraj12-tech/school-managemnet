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
    @Column(name = "relationship_type")
    private String relationshipType;
    @Column(name = "is_emergency_contact")
    private boolean emergencyContact;
}
