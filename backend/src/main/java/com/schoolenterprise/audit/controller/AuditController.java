package com.schoolenterprise.audit.controller;

import com.schoolenterprise.audit.dto.AuditLogResponse;
import com.schoolenterprise.audit.dto.AuditUserResponse;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @RequirePermission(module = "audit", action = "view")
    public ApiResponse<List<AuditLogResponse>> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return ApiResponse.ok(auditService.search(userId, module, action, from, to));
    }

    @GetMapping("/users")
    @RequirePermission(module = "audit", action = "view")
    public ApiResponse<List<AuditUserResponse>> users() {
        return ApiResponse.ok(auditService.users());
    }
}
