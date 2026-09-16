package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.StudentGuardian;
import com.schoolenterprise.student.entity.StudentGuardianId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, StudentGuardianId> {
    List<StudentGuardian> findByStudentId(Long studentId);
    List<StudentGuardian> findByGuardianId(Long guardianId);
    long countByGuardianId(Long guardianId);
    boolean existsByStudentIdAndGuardianId(Long studentId, Long guardianId);
}
