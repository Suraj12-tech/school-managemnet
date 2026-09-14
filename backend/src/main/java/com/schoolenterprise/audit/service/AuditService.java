package com.schoolenterprise.audit.service;

import com.schoolenterprise.audit.entity.AuditLog;
import com.schoolenterprise.audit.repository.AuditLogRepository;
import com.schoolenterprise.common.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

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
}
