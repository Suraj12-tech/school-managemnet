package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.Campus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampusRepository extends JpaRepository<Campus, Long> {
    List<Campus> findBySchoolId(Long schoolId);
}
