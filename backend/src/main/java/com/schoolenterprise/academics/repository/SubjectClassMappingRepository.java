package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.SubjectClassMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectClassMappingRepository extends JpaRepository<SubjectClassMapping, Long> {
    List<SubjectClassMapping> findBySubjectId(Long subjectId);
    List<SubjectClassMapping> findByClassIdAndAcademicYearId(Long classId, Long academicYearId);
    boolean existsBySubjectIdAndClassIdAndAcademicYearId(Long subjectId, Long classId, Long academicYearId);
    Optional<SubjectClassMapping> findBySubjectIdAndClassIdAndAcademicYearId(
            Long subjectId, Long classId, Long academicYearId);
    long countBySubjectId(Long subjectId);
    void deleteBySubjectId(Long subjectId);
}
