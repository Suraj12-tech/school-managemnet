package com.schoolenterprise.staff.repository;

import com.schoolenterprise.staff.entity.Staff;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUserId(Long userId);
    List<Staff> findAllByUserId(Long userId);
    Optional<Staff> findByEmployeeId(String employeeId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Staff s where s.id = :id")
    Optional<Staff> findByIdForUpdate(@Param("id") Long id);
    boolean existsByEmployeeId(String employeeId);
    boolean existsByEmployeeIdAndIdNot(String employeeId, Long id);
    long countByDepartmentId(Long departmentId);
    List<Staff> findByDepartmentId(Long departmentId);
}
