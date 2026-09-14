package com.schoolenterprise.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "permission")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_name", nullable = false)
    private String moduleName;

    @Column(name = "action_name", nullable = false)
    private String actionName;

    private String description;

    @Column(nullable = false)
    private String sensitivity = "NORMAL";
}
