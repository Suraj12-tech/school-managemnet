package com.schoolenterprise.identity.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.identity.dto.UserRequest;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.PermissionRepository;
import com.schoolenterprise.identity.repository.RoleRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IdentityService {

    private final AppUserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserScopeRepository userScopeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<AppUser> users() {
        return userRepository.findAll();
    }

    public AppUser getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> AppException.notFound("User not found"));
    }

    @Transactional
    public AppUser createUser(UserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw AppException.badRequest("Username already exists");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw AppException.badRequest("Email already exists");
        }
        if (req.getPassword() == null || req.getPassword().length() < 8) {
            throw AppException.badRequest("Password must be at least 8 characters");
        }
        AppUser user = new AppUser();
        apply(user, req, true);
        AppUser saved = userRepository.save(user);
        auditService.record("users", "create", "AppUser", saved.getId(), saved.getUsername());
        return saved;
    }

    @Transactional
    public AppUser updateUser(Long id, UserRequest req) {
        AppUser user = getUser(id);
        apply(user, req, false);
        AppUser saved = userRepository.save(user);
        auditService.record("users", "edit", "AppUser", saved.getId(), saved.getUsername());
        return saved;
    }

    public List<Role> roles() {
        return roleRepository.findAll();
    }

    @Transactional
    public Role saveRole(Long id, String name, String description, String sensitivity, List<Long> permissionIds) {
        Role role = id == null ? new Role() : roleRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Role not found"));
        role.setName(name);
        role.setDescription(description);
        role.setSensitivity(sensitivity == null ? "NORMAL" : sensitivity);
        if (permissionIds != null) {
            role.setPermissions(new HashSet<>(permissionRepository.findAllById(permissionIds)));
        }
        Role saved = roleRepository.save(role);
        auditService.record("users", "edit", "Role", saved.getId(), saved.getName());
        return saved;
    }

    public List<com.schoolenterprise.identity.entity.Permission> permissions() {
        return permissionRepository.findAll();
    }

    private void apply(AppUser user, UserRequest req, boolean creating) {
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());
        user.setStatus(req.getStatus() == null ? "ACTIVE" : req.getStatus());
        if (creating || (req.getPassword() != null && !req.getPassword().isBlank())) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(req.getRoleIds()));
            user.setRoles(roles);
        }
        user.getScopes().clear();
        if (req.getScopes() != null) {
            for (UserRequest.ScopeRequest s : req.getScopes()) {
                UserScope scope = new UserScope();
                scope.setUser(user);
                scope.setScopeType(s.getScopeType());
                scope.setScopeId(s.getScopeId());
                user.getScopes().add(scope);
            }
        }
    }
}
