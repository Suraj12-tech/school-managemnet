package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, Long> {
    List<PayrollRecord> findByStaffId(Long staffId);
    boolean existsByStaffIdAndPayPeriod(Long staffId, String payPeriod);
    boolean existsByStaffIdAndPayPeriodAndIdNot(Long staffId, String payPeriod, Long id);
}
