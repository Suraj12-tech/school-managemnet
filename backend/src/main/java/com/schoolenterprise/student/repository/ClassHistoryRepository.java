package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.ClassHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassHistoryRepository extends JpaRepository<ClassHistory, Long> {
    List<ClassHistory> findByStudentId(Long studentId);
}
