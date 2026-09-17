package com.schoolenterprise.audit.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLogResponse {
    private Long id;
    private LocalDateTime createdAt;
    private Long userId;
    private String userName;
    private String userEmail;
    private String moduleName;
    private String actionName;
    private String entityName;
    private Long entityId;
    private String details;
}
