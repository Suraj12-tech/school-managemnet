package com.schoolenterprise.staff.repository;

import com.schoolenterprise.staff.entity.TeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {
    List<TeacherAssignment> findByStaffId(Long staffId);
    List<TeacherAssignment> findBySubjectId(Long subjectId);
    boolean existsBySectionId(Long sectionId);
    void deleteBySubjectId(Long subjectId);
}
