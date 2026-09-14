package com.schoolenterprise.student.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class StudentGuardianId implements Serializable {
    private Long studentId;
    private Long guardianId;
}
