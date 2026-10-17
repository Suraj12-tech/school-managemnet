package com.schoolenterprise.attendance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "attendance_record")
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "attendance_status", nullable = false, length = 20)
    private String status;

    @Column(name = "marked_by_staff_id", nullable = false)
    private Long markedByStaffId;
}
