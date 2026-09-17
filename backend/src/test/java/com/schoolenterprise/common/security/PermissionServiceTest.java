package com.schoolenterprise.common.security;

import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private StaffRepository staffRepository;
    @Mock
    private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock
    private AcademicYearRepository academicYearRepository;
    @InjectMocks
    private PermissionService permissionService;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void teacherWithoutFeesPermissionIsBlocked() {
        login("teacher", Set.of("CLASS_TEACHER"), Set.of("students:view"), List.of());
        assertThrows(AppException.class, () -> permissionService.require("fees", "view"));
    }

    @Test
    void adminBypassesModuleCheck() {
        login("admin", Set.of("ADMIN"), Set.of(), List.of());
        assertDoesNotThrow(() -> permissionService.require("fees", "approve"));
    }

    @Test
    void feesNeedFinancialRoleEvenIfPermissionIsPresent() {
        AppUserDetails details = new AppUserDetails(
                3L, "teacher", "x", true,
                Set.of("CLASS_TEACHER"),
                Set.of("fees:view"),
                Set.of("NORMAL"),
                List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
        assertThrows(AppException.class, () -> permissionService.require("fees", "view"));
    }

    @Test
    void sectionScopeBlocksOtherSections() {
        UserScope scope = new UserScope();
        scope.setScopeType("SECTION");
        scope.setScopeId(10L);
        login("teacher", Set.of("CLASS_TEACHER"), Set.of("students:view"), List.of(scope));
        when(staffRepository.findByUserId(2L)).thenReturn(Optional.empty());
        assertThrows(AppException.class, () -> permissionService.assertStudentSection(99L));
        assertDoesNotThrow(() -> permissionService.assertStudentSection(10L));
    }

    private void login(String username, Set<String> roles, Set<String> permissions, List<UserScope> scopes) {
        AppUserDetails details = new AppUserDetails(2L, username, "x", true, roles, permissions, scopes);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
    }
}
