package com.schoolenterprise.identity.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.auth.entity.LoginSession;
import com.schoolenterprise.auth.repository.LoginSessionRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.identity.dto.StaffLinkOption;
import com.schoolenterprise.identity.dto.UserRequest;
import com.schoolenterprise.identity.dto.UserStatusRequest;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.PermissionRepository;
import com.schoolenterprise.identity.repository.RoleRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import com.schoolenterprise.school.repository.CampusRepository;
import com.schoolenterprise.school.repository.SchoolRepository;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.student.repository.StudentRepository;
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
    private final PermissionService permissionService;
    private final SchoolRepository schoolRepository;
    private final CampusRepository campusRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final LoginSessionRepository loginSessionRepository;

    @Transactional(readOnly = true)
    public List<AppUser> users() {
        List<AppUser> users = userRepository.findAll();
        users.forEach(u -> {
            u.getRoles().size();
            u.getScopes().size();
        });
        return users;
    }

    @Transactional(readOnly = true)
    public AppUser getUser(Long id) {
        AppUser user = userRepository.findById(id).orElseThrow(() -> AppException.notFound("User not found"));
        user.getRoles().size();
        user.getScopes().size();
        return user;
    }

    @Transactional
    public AppUser createUser(UserRequest req) {
        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw AppException.badRequest("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw AppException.badRequest("Email already exists");
        }
        if (req.getPassword() == null || req.getPassword().isBlank() || req.getPassword().length() < 8) {
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
        AppUser user = userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> AppException.notFound("User not found"));
        user.getRoles().size();
        user.getScopes().size();
        if (permissionService.currentUser().getUserId().equals(id)
                && "INACTIVE".equals(req.getStatus())) {
            throw AppException.badRequest("You cannot deactivate your own account");
        }
        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw AppException.badRequest("Username already exists");
        }
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw AppException.badRequest("Email already exists");
        }
        apply(user, req, false);
        AppUser saved = userRepository.save(user);
        if ("INACTIVE".equals(saved.getStatus())) {
            revokeSessions(saved.getId());
        }
        auditService.record("users", "edit", "AppUser", saved.getId(), saved.getUsername());
        return saved;
    }

    @Transactional
    public AppUser updateStatus(Long id, UserStatusRequest request) {
        AppUser user = userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> AppException.notFound("User not found"));
        user.getRoles().size();
        user.getScopes().size();
        if (permissionService.currentUser().getUserId().equals(id)
                && "INACTIVE".equals(request.getStatus())) {
            throw AppException.badRequest("You cannot deactivate your own account");
        }
        user.setStatus(request.getStatus());
        AppUser saved = userRepository.save(user);
        if ("INACTIVE".equals(saved.getStatus())) {
            revokeSessions(saved.getId());
        }
        auditService.record("users", "edit", "AppUser", saved.getId(), "Status " + saved.getStatus());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<StaffLinkOption> teacherStaffOptions() {
        return staffRepository.findAll().stream().map(StaffLinkOption::new).toList();
    }

    @Transactional
    public void linkStaff(Long userId, Long staffId) {
        AppUser user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        List<Staff> currentLinks = staffRepository.findAllByUserId(userId);
        if (currentLinks.size() > 1) {
            throw AppException.conflict("Multiple Staff links exist for this user; an Admin must resolve them before changing the link");
        }

        Staff target = staffRepository.findByIdForUpdate(staffId)
                .orElseThrow(() -> AppException.notFound("Staff not found"));
        if (currentLinks.size() == 1 && currentLinks.get(0).getId().equals(staffId)) {
            if (!userId.equals(target.getUserId())) {
                throw AppException.conflict("Staff link data is inconsistent and requires Admin review");
            }
            return;
        }
        if (!"ACTIVE".equals(target.getStatus()) || !"TEACHING".equals(target.getStaffCategory())) {
            throw AppException.badRequest("Only ACTIVE Staff categorized as TEACHING can be linked to a teacher account");
        }
        if (target.getUserId() != null && !userId.equals(target.getUserId())) {
            throw AppException.conflict("Staff is already linked to another user");
        }
        if (target.getUserId() != null && currentLinks.isEmpty()) {
            throw AppException.conflict("Staff link data is inconsistent and requires Admin review");
        }

        Staff previous = null;
        if (!currentLinks.isEmpty()) {
            previous = staffRepository.findByIdForUpdate(currentLinks.get(0).getId())
                    .orElseThrow(() -> AppException.conflict("Existing Staff link requires Admin review"));
            if (!userId.equals(previous.getUserId())) {
                throw AppException.conflict("Staff link data changed during the request; reload and try again");
            }
            previous.setUserId(null);
            staffRepository.save(previous);
        }

        target.setUserId(userId);
        staffRepository.save(target);
        revokeSessions(userId);
        String previousId = previous == null ? "none" : previous.getId().toString();
        auditService.record("users", "edit", "AppUser", user.getId(),
                "Staff link changed from " + previousId + " to " + target.getId());
    }

    @Transactional
    public void unlinkStaff(Long userId) {
        AppUser user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        List<Staff> currentLinks = staffRepository.findAllByUserId(userId);
        if (currentLinks.size() > 1) {
            throw AppException.conflict("Multiple Staff links exist for this user; an Admin must resolve them before unlinking");
        }
        if (currentLinks.isEmpty()) {
            return;
        }
        Staff linked = staffRepository.findByIdForUpdate(currentLinks.get(0).getId())
                .orElseThrow(() -> AppException.conflict("Existing Staff link requires Admin review"));
        if (!userId.equals(linked.getUserId())) {
            throw AppException.conflict("Staff link data changed during the request; reload and try again");
        }
        linked.setUserId(null);
        staffRepository.save(linked);
        revokeSessions(userId);
        auditService.record("users", "edit", "AppUser", user.getId(),
                "Staff " + linked.getId() + " unlinked");
    }

    @Transactional(readOnly = true)
    public List<Role> roles() {
        List<Role> roles = roleRepository.findAll();
        roles.forEach(r -> r.getPermissions().size());
        return roles;
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
        user.setUsername(req.getUsername().trim());
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setFullName(req.getFullName().trim());
        user.setPhone(req.getPhone() == null ? null : req.getPhone().trim());
        user.setStatus(req.getStatus() == null ? "ACTIVE" : req.getStatus());
        if (creating || (req.getPassword() != null && !req.getPassword().isBlank())) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRoleIds() != null) {
            Set<Role> roles = rolesFor(req.getRoleIds());
            if (!permissionService.isAdmin()) {
                Set<String> permissions = permissionService.currentUser().getPermissions();
                if (roles.stream().flatMap(role -> role.getPermissions().stream())
                        .anyMatch(permission -> !permissions.contains(permission.getModuleName() + ":" + permission.getActionName()))) {
                    throw AppException.forbidden("You cannot assign a role with permissions you do not hold");
                }
            }
            user.setRoles(roles);
        }
        if (req.getScopes() != null) {
            Set<String> uniqueScopes = new HashSet<>();
            user.getScopes().clear();
            for (UserRequest.ScopeRequest s : req.getScopes()) {
                String scopeType = s.getScopeType().trim().toUpperCase();
                validateScope(scopeType, s.getScopeId());
                if (!permissionService.canAssignScope(scopeType, s.getScopeId())) {
                    throw AppException.forbidden("You cannot assign a scope outside your own access");
                }
                if (!uniqueScopes.add(scopeType + ":" + s.getScopeId())) {
                    throw AppException.badRequest("Duplicate user scope");
                }
                UserScope scope = new UserScope();
                scope.setUser(user);
                scope.setScopeType(scopeType);
                scope.setScopeId(s.getScopeId());
                user.getScopes().add(scope);
            }
        }
    }

    private Set<Role> rolesFor(List<Long> roleIds) {
        Set<Role> roles = new HashSet<>(roleRepository.findAllById(roleIds));
        if (roles.size() != new HashSet<>(roleIds).size()) {
            throw AppException.badRequest("One or more roles were not found");
        }
        return roles;
    }

    private void revokeSessions(Long userId) {
        List<LoginSession> activeSessions = loginSessionRepository.findByUserIdAndRevokedFalse(userId);
        activeSessions.forEach(session -> session.setRevoked(true));
        loginSessionRepository.saveAll(activeSessions);
    }

    private void validateScope(String scopeType, Long scopeId) {
        boolean exists = switch (scopeType) {
            case "SCHOOL" -> schoolRepository.existsById(scopeId);
            case "CAMPUS" -> campusRepository.existsById(scopeId);
            case "CLASS" -> schoolClassRepository.existsById(scopeId);
            case "SECTION" -> sectionRepository.existsById(scopeId);
            case "SUBJECT" -> subjectRepository.existsById(scopeId);
            case "STUDENT", "ASSIGNED_STUDENT" -> studentRepository.existsById(scopeId);
            default -> false;
        };
        if (!exists) {
            throw AppException.badRequest("Scope target was not found");
        }
    }
}
