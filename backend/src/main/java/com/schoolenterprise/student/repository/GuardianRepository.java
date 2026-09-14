package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {
}
