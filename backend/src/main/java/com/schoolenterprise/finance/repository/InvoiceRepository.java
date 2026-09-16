package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByStudentId(Long studentId);
    List<Invoice> findByStatus(String status);
    long countByInvoiceNumberStartingWith(String prefix);
    List<Invoice> findByStatusAndDueDateBefore(String status, LocalDate date);
    boolean existsByAcademicYearId(Long academicYearId);
}
