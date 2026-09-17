package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.FeeHead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeHeadRepository extends JpaRepository<FeeHead, Long> {
    List<FeeHead> findBySchoolId(Long schoolId);
}
