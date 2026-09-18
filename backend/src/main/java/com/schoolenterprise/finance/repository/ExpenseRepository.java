package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findBySchoolId(Long schoolId);
}
