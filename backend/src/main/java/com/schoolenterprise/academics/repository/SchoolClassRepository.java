package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    List<SchoolClass> findBySchoolId(Long schoolId);
    boolean existsBySchoolIdAndNameIgnoreCase(Long schoolId, String name);
}
