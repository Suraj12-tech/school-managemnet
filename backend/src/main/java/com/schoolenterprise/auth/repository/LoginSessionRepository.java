package com.schoolenterprise.auth.repository;

import com.schoolenterprise.auth.entity.LoginSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface LoginSessionRepository extends JpaRepository<LoginSession, Long> {
    Optional<LoginSession> findByTokenId(String tokenId);
    List<LoginSession> findByUserIdAndRevokedFalse(Long userId);
}
