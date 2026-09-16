package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByClassId(Long classId);
    List<Section> findByAcademicYearId(Long academicYearId);
    List<Section> findByClassIdIn(java.util.Collection<Long> classIds);
    boolean existsByClassIdAndAcademicYearIdAndNameIgnoreCase(Long classId, Long academicYearId, String name);
    long countByClassIdAndAcademicYearId(Long classId, Long academicYearId);
}
