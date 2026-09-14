package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolRepository extends JpaRepository<School, Long> {
}
