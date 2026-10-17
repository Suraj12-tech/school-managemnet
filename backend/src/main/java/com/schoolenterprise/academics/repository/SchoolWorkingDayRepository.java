package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.SchoolWorkingDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolWorkingDayRepository extends JpaRepository<SchoolWorkingDay, Long> {

    List<SchoolWorkingDay> findBySchoolIdOrderByDisplayOrderAsc(Long schoolId);

    void deleteBySchoolId(Long schoolId);
}
