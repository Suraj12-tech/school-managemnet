package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.StudentFeeAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentFeeAccountRepository extends JpaRepository<StudentFeeAccount, Long> {
    Optional<StudentFeeAccount> findByStudentIdAndAcademicYearId(Long studentId, Long academicYearId);
    List<StudentFeeAccount> findByAcademicYearId(Long academicYearId);
}
