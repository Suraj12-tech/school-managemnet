package com.schoolenterprise.identity.repository;

import com.schoolenterprise.identity.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    Optional<AppUser> findByEmail(String email);

    Optional<AppUser> findByResetToken(String resetToken);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("select u from AppUser u left join fetch u.roles r left join fetch r.permissions where u.username = :username")
    Optional<AppUser> findByUsernameWithRoles(String username);
}
