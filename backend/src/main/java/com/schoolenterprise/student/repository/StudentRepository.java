package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByAdmissionNumber(String admissionNumber);
    boolean existsByAdmissionNumber(String admissionNumber);
    List<Student> findByCurrentSectionIdIn(java.util.Collection<Long> sectionIds);
    long countByStatus(String status);
}
