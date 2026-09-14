package com.schoolenterprise.audit.controller;

import com.schoolenterprise.audit.entity.AuditLog;
import com.schoolenterprise.audit.repository.AuditLogRepository;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @RequirePermission(module = "audit", action = "view")
    public ApiResponse<List<AuditLog>> list() {
        return ApiResponse.ok(auditLogRepository.findTop200ByOrderByIdDesc());
    }
}
