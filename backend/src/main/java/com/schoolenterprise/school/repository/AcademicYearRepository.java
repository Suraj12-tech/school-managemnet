package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    List<AcademicYear> findBySchoolId(Long schoolId);
    List<AcademicYear> findBySchoolIdAndCurrentYearTrue(Long schoolId);
}
