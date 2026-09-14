package com.schoolenterprise.finance.repository;

import com.schoolenterprise.finance.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByPaymentId(Long paymentId);
    long countByReceiptNumberStartingWith(String prefix);
}
