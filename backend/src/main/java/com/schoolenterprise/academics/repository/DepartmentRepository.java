package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findBySchoolId(Long schoolId);
}
