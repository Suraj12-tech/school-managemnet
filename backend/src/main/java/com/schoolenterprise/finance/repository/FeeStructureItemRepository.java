package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.FeeStructureItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeStructureItemRepository extends JpaRepository<FeeStructureItem, Long> {
    List<FeeStructureItem> findByFeeStructureId(Long feeStructureId);
    void deleteByFeeStructureId(Long feeStructureId);
}
