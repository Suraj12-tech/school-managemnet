package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {
    List<Guardian> findByIdIn(java.util.Collection<Long> ids);
}
