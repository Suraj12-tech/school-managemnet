package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findBySchoolId(Long schoolId);
    boolean existsBySchoolIdAndCodeIgnoreCase(Long schoolId, String code);
    boolean existsBySchoolIdAndNameIgnoreCase(Long schoolId, String name);
    long countByDepartmentId(Long departmentId);
}
