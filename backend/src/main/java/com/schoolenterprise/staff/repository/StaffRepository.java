package com.schoolenterprise.staff.repository;

import com.schoolenterprise.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);
    Optional<Staff> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    boolean existsByEmployeeIdAndIdNot(String employeeId, Long id);
    long countByDepartmentId(Long departmentId);
    List<Staff> findByDepartmentId(Long departmentId);
}
