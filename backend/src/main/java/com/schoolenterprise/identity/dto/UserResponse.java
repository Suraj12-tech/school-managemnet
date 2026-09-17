package com.schoolenterprise.identity.dto;

import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.entity.UserScope;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class UserResponse {
    private final Long id;
    private final String username;
    private final String email;
    private final String fullName;
    private final String phone;
    private final String status;
    private final LocalDateTime createdAt;
    private final List<RoleSummary> roles;
    private final List<ScopeSummary> scopes;

    private UserResponse(AppUser user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.status = user.getStatus();
        this.createdAt = user.getCreatedAt();
        this.roles = user.getRoles().stream().map(RoleSummary::new).toList();
        this.scopes = user.getScopes().stream().map(ScopeSummary::new).toList();
    }

    public static UserResponse from(AppUser user) {
        return new UserResponse(user);
    }

    @Getter
    public static class RoleSummary {
        private final Long id;
        private final String name;
        private final String sensitivity;

        private RoleSummary(Role role) {
            this.id = role.getId();
            this.name = role.getName();
            this.sensitivity = role.getSensitivity();
        }
    }

    @Getter
    public static class ScopeSummary {
        private final Long id;
        private final String scopeType;
        private final Long scopeId;

        private ScopeSummary(UserScope scope) {
            this.id = scope.getId();
            this.scopeType = scope.getScopeType();
            this.scopeId = scope.getScopeId();
        }
    }
}
