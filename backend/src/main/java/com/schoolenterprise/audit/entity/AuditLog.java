package com.schoolenterprise.audit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "module_name")
    private String moduleName;
    @Column(name = "action_name")
    private String actionName;
    @Column(name = "entity_name")
    private String entityName;
    @Column(name = "entity_id")
    private Long entityId;
    private String details;
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
