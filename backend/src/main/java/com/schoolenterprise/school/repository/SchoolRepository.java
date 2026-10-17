package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.School;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SchoolRepository extends JpaRepository<School, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from School s where s.id = :id")
    Optional<School> findByIdForUpdate(@Param("id") Long id);
}
