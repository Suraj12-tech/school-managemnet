package com.schoolenterprise.identity.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.identity.dto.UserRequest;
import com.schoolenterprise.identity.dto.UserResponse;
import com.schoolenterprise.identity.dto.UserStatusRequest;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Permission;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.service.IdentityService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IdentityController {

    private final IdentityService identityService;

    @GetMapping("/users")
    @RequirePermission(module = "users", action = "view")
    public ApiResponse<List<UserResponse>> users() {
        return ApiResponse.ok(identityService.users().stream().map(UserResponse::from).toList());
    }

    @GetMapping("/users/{id}")
    @RequirePermission(module = "users", action = "view")
    public ApiResponse<UserResponse> user(@PathVariable Long id) {
        return ApiResponse.ok(UserResponse.from(identityService.getUser(id)));
    }

    @PostMapping("/users")
    @RequirePermission(module = "users", action = "create")
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ApiResponse.ok("User created", UserResponse.from(identityService.createUser(request)));
    }

    @PutMapping("/users/{id}")
    @RequirePermission(module = "users", action = "edit")
    public ApiResponse<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ApiResponse.ok("User updated", UserResponse.from(identityService.updateUser(id, request)));
    }

    @PatchMapping("/users/{id}/status")
    @RequirePermission(module = "users", action = "edit")
    public ApiResponse<UserResponse> updateStatus(@PathVariable Long id,
                                                   @Valid @RequestBody UserStatusRequest request) {
        return ApiResponse.ok("User status updated",
                UserResponse.from(identityService.updateStatus(id, request)));
    }

    @GetMapping("/roles")
    @RequirePermission(module = "users", action = "view")
    public ApiResponse<List<Role>> roles() {
        return ApiResponse.ok(identityService.roles());
    }

    @PostMapping("/roles")
    @RequirePermission(module = "users", action = "create")
    public ApiResponse<Role> createRole(@RequestBody RoleBody body) {
        return ApiResponse.ok(identityService.saveRole(null, body.getName(), body.getDescription(), body.getSensitivity(), body.getPermissionIds()));
    }

    @PutMapping("/roles/{id}")
    @RequirePermission(module = "users", action = "edit")
    public ApiResponse<Role> updateRole(@PathVariable Long id, @RequestBody RoleBody body) {
        return ApiResponse.ok(identityService.saveRole(id, body.getName(), body.getDescription(), body.getSensitivity(), body.getPermissionIds()));
    }

    @GetMapping("/permissions")
    @RequirePermission(module = "users", action = "view")
    public ApiResponse<List<Permission>> permissions() {
        return ApiResponse.ok(identityService.permissions());
    }

    @Data
    public static class RoleBody {
        private String name;
        private String description;
        private String sensitivity;
        private List<Long> permissionIds;
    }
}
