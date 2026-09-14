package com.schoolenterprise.identity.repository;

import com.schoolenterprise.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByModuleNameAndActionName(String moduleName, String actionName);
}
