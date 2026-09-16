package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.Concession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConcessionRepository extends JpaRepository<Concession, Long> {
    List<Concession> findByStudentId(Long studentId);
    List<Concession> findByStudentIdAndAcademicYearId(Long studentId, Long academicYearId);
}
