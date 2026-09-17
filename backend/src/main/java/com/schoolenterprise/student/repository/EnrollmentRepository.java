package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findBySectionId(Long sectionId);
    boolean existsByStudentIdAndAcademicYearId(Long studentId, Long academicYearId);
}
