package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    List<FeeStructure> findByAcademicYearId(Long academicYearId);
    List<FeeStructure> findByAcademicYearIdAndClassIdAndCategory(Long academicYearId, Long classId, String category);
    boolean existsByAcademicYearIdAndClassIdAndCategory(Long academicYearId, Long classId, String category);
    boolean existsByAcademicYearIdAndClassIdAndCategoryAndIdNot(Long academicYearId, Long classId, String category, Long id);
}
