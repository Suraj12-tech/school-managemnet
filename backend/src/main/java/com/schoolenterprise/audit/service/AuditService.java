package com.schoolenterprise.audit.service;

import com.schoolenterprise.audit.entity.AuditLog;
import com.schoolenterprise.audit.repository.AuditLogRepository;
import com.schoolenterprise.audit.dto.AuditLogResponse;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;
    private final AppUserRepository appUserRepository;

    public void record(String module, String action, String entityName, Long entityId, String details) {
        AuditLog row = new AuditLog();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails user) {
            row.setUserId(user.getUserId());
        }
        row.setModuleName(module);
        row.setActionName(action);
        row.setEntityName(entityName);
        row.setEntityId(entityId);
        row.setDetails(details);
        auditLogRepository.save(row);
        log.info("AUDIT {} {} {}#{} {}", module, action, entityName, entityId, details);
    }

    public List<AuditLogResponse> search(Long userId, String module, String action,
                                         LocalDate from, LocalDate to) {
        return auditLogRepository.findTop200ByOrderByIdDesc().stream()
                .filter(row -> userId == null || userId.equals(row.getUserId()))
                .filter(row -> module == null || module.isBlank()
                        || module.equalsIgnoreCase(row.getModuleName()))
                .filter(row -> action == null || action.isBlank()
                        || action.equalsIgnoreCase(row.getActionName()))
                .filter(row -> inDateRange(row.getCreatedAt(), from, to))
                .map(this::toResponse)
                .toList();
    }

    public List<com.schoolenterprise.audit.dto.AuditUserResponse> users() {
        return appUserRepository.findAll().stream()
                .map(user -> new com.schoolenterprise.audit.dto.AuditUserResponse(
                        user.getId(), user.getFullName(), user.getEmail()))
                .toList();
    }

    private boolean inDateRange(java.time.LocalDateTime timestamp, LocalDate from, LocalDate to) {
        return (from == null && to == null) || (timestamp != null
                && (from == null || !timestamp.toLocalDate().isBefore(from))
                && (to == null || !timestamp.toLocalDate().isAfter(to)));
    }

    private AuditLogResponse toResponse(com.schoolenterprise.audit.entity.AuditLog row) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(row.getId());
        response.setCreatedAt(row.getCreatedAt());
        response.setUserId(row.getUserId());
        response.setModuleName(row.getModuleName());
        response.setActionName(row.getActionName());
        response.setEntityName(row.getEntityName());
        response.setEntityId(row.getEntityId());
        response.setDetails(row.getDetails());
        if (row.getUserId() != null) {
            appUserRepository.findById(row.getUserId()).ifPresent(user -> {
                response.setUserName(user.getFullName());
                response.setUserEmail(user.getEmail());
            });
        }
        return response;
    }
}
