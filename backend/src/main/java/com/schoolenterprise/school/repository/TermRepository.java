package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.Term;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TermRepository extends JpaRepository<Term, Long> {
    List<Term> findByAcademicYearId(Long academicYearId);
    boolean existsByAcademicYearIdAndNameIgnoreCase(Long academicYearId, String name);
}
