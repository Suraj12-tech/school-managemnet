package com.schoolenterprise.common.security;

import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Permission;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppUserDetailsServiceTest {
    @Mock private AppUserRepository userRepository;
    @Mock private UserScopeRepository userScopeRepository;

    @Test
    void rolePermissionChangesAreReloadedRatherThanTakenFromJwtClaims() {
        Permission initialPermission = permission("students", "view");
        Role role = new Role();
        role.setName("TEACHER");
        role.setPermissions(new HashSet<>(Set.of(initialPermission)));
        AppUser user = new AppUser();
        user.setId(2L);
        user.setUsername("teacher");
        user.setPasswordHash("encoded");
        user.setStatus("ACTIVE");
        user.setRoles(new HashSet<>(Set.of(role)));
        when(userRepository.findByUsernameOrEmailWithRoles("teacher")).thenReturn(Optional.of(user));
        when(userScopeRepository.findByUserId(2L)).thenReturn(List.of());

        AppUserDetailsService service = new AppUserDetailsService(userRepository, userScopeRepository);
        AppUserDetails firstRequest = (AppUserDetails) service.loadUserByUsername("teacher");
        role.setPermissions(new HashSet<>(Set.of(permission("classes", "view"))));
        AppUserDetails nextRequest = (AppUserDetails) service.loadUserByUsername("teacher");

        assertTrue(firstRequest.getPermissions().contains("students:view"));
        assertFalse(firstRequest.getPermissions().contains("classes:view"));
        assertFalse(nextRequest.getPermissions().contains("students:view"));
        assertTrue(nextRequest.getPermissions().contains("classes:view"));
    }

    @Test
    void teacherRolesReceiveOnlyApprovedReadPermissions() {
        Role teacherRole = new Role();
        teacherRole.setName("CLASS_TEACHER");
        teacherRole.setPermissions(new HashSet<>(Set.of(
                permission("students", "view"),
                permission("students", "edit"),
                permission("classes", "view"),
                permission("subjects", "view"),
                permission("dashboard", "view"),
                permission("finance", "view"),
                permission("users", "view")
        )));
        AppUser user = new AppUser();
        user.setId(2L);
        user.setUsername("teacher");
        user.setPasswordHash("encoded");
        user.setStatus("ACTIVE");
        user.setRoles(new HashSet<>(Set.of(teacherRole)));
        when(userRepository.findByUsernameOrEmailWithRoles("teacher")).thenReturn(Optional.of(user));
        when(userScopeRepository.findByUserId(2L)).thenReturn(List.of());

        AppUserDetails details = (AppUserDetails) new AppUserDetailsService(userRepository, userScopeRepository)
                .loadUserByUsername("teacher");

        assertTrue(details.getPermissions().contains("students:view"));
        assertFalse(details.getPermissions().contains("students:edit"));
        assertFalse(details.getPermissions().contains("finance:view"));
        assertFalse(details.getPermissions().contains("users:view"));
    }

    private Permission permission(String module, String action) {
        Permission permission = new Permission();
        permission.setModuleName(module);
        permission.setActionName(action);
        return permission;
    }
}
