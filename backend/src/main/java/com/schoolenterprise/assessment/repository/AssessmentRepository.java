package com.schoolenterprise.assessment.repository;

import com.schoolenterprise.assessment.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByStatusOrderByAssessmentDateAsc(String status);
}
