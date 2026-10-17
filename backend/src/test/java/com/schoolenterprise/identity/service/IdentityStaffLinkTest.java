package com.schoolenterprise.identity.service;

import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.auth.entity.LoginSession;
import com.schoolenterprise.auth.repository.LoginSessionRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.PermissionRepository;
import com.schoolenterprise.identity.repository.RoleRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import com.schoolenterprise.school.repository.CampusRepository;
import com.schoolenterprise.school.repository.SchoolRepository;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentityStaffLinkTest {
    @Mock private AppUserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private UserScopeRepository userScopeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;
    @Mock private PermissionService permissionService;
    @Mock private SchoolRepository schoolRepository;
    @Mock private CampusRepository campusRepository;
    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private LoginSessionRepository loginSessionRepository;
    @InjectMocks private IdentityService identityService;

    @Test
    void linksOnlyExplicitActiveTeachingStaffAndRevokesExistingSessions() {
        AppUser user = user(2L);
        Staff staff = staff(10L, null, "ACTIVE", "TEACHING");
        LoginSession session = session(2L);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user));
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of());
        when(staffRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(staff));
        when(staffRepository.save(staff)).thenReturn(staff);
        when(loginSessionRepository.findByUserIdAndRevokedFalse(2L)).thenReturn(List.of(session));

        identityService.linkStaff(2L, 10L);

        assertEquals(2L, staff.getUserId());
        assertEquals(true, session.isRevoked());
        verify(staffRepository).save(staff);
        verify(loginSessionRepository).saveAll(List.of(session));
    }

    @Test
    void rejectsStaffAlreadyLinkedToAnotherUserWithoutMutation() {
        Staff staff = staff(10L, 9L, "ACTIVE", "TEACHING");
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user(2L)));
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of());
        when(staffRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(staff));

        AppException error = assertThrows(AppException.class, () -> identityService.linkStaff(2L, 10L));

        assertEquals(409, error.getStatus().value());
        assertEquals(9L, staff.getUserId());
        verify(staffRepository, never()).save(any(Staff.class));
        verify(loginSessionRepository, never()).saveAll(any());
    }

    @Test
    void rejectsExistingDuplicateLinksWithoutChoosingOne() {
        Staff first = staff(10L, 2L, "ACTIVE", "TEACHING");
        Staff second = staff(11L, 2L, "ACTIVE", "TEACHING");
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user(2L)));
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(first, second));

        AppException error = assertThrows(AppException.class, () -> identityService.linkStaff(2L, 12L));

        assertEquals(409, error.getStatus().value());
        verify(staffRepository, never()).save(any(Staff.class));
        verify(loginSessionRepository, never()).saveAll(any());
    }

    @Test
    void reassignmentAtomicallyMovesTheLinkAndRevokesOldSessions() {
        AppUser user = user(2L);
        Staff previous = staff(10L, 2L, "ACTIVE", "TEACHING");
        Staff next = staff(11L, null, "ACTIVE", "TEACHING");
        LoginSession session = session(2L);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user));
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(previous));
        when(staffRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(next));
        when(staffRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(previous));
        when(staffRepository.save(previous)).thenReturn(previous);
        when(staffRepository.save(next)).thenReturn(next);
        when(loginSessionRepository.findByUserIdAndRevokedFalse(2L)).thenReturn(List.of(session));

        identityService.linkStaff(2L, 11L);

        assertNull(previous.getUserId());
        assertEquals(2L, next.getUserId());
        assertEquals(true, session.isRevoked());
        verify(staffRepository).save(previous);
        verify(staffRepository).save(next);
        verify(loginSessionRepository).saveAll(List.of(session));
    }

    @Test
    void rejectsInactiveNonTeachingAndUnclassifiedStaff() {
        for (Staff staff : List.of(
                staff(10L, null, "INACTIVE", "TEACHING"),
                staff(11L, null, "ACTIVE", "NON_TEACHING"),
                staff(12L, null, "ACTIVE", null))) {
            when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user(2L)));
            when(staffRepository.findAllByUserId(2L)).thenReturn(List.of());
            when(staffRepository.findByIdForUpdate(staff.getId())).thenReturn(Optional.of(staff));

            assertThrows(AppException.class, () -> identityService.linkStaff(2L, staff.getId()));
            verify(staffRepository, never()).save(any(Staff.class));
            org.mockito.Mockito.reset(userRepository, staffRepository);
        }
    }

    @Test
    void unlinkClearsStaffAndRevokesSessions() {
        Staff staff = staff(10L, 2L, "ACTIVE", "TEACHING");
        LoginSession session = session(2L);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user(2L)));
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff));
        when(staffRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(staff));
        when(staffRepository.save(staff)).thenReturn(staff);
        when(loginSessionRepository.findByUserIdAndRevokedFalse(2L)).thenReturn(List.of(session));

        identityService.unlinkStaff(2L);

        assertNull(staff.getUserId());
        assertEquals(true, session.isRevoked());
        verify(staffRepository).save(staff);
        verify(loginSessionRepository).saveAll(List.of(session));
    }

    @Test
    void accountDeactivationRevokesAllExistingSessions() {
        AppUser user = user(2L);
        LoginSession session = session(2L);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user));
        when(permissionService.currentUser()).thenReturn(new AppUserDetails(9L, "admin", "x", true,
                Set.of("ADMIN"), Set.of(), List.of()));
        when(userRepository.save(user)).thenReturn(user);
        when(loginSessionRepository.findByUserIdAndRevokedFalse(2L)).thenReturn(List.of(session));

        var request = new com.schoolenterprise.identity.dto.UserStatusRequest();
        request.setStatus("INACTIVE");
        identityService.updateStatus(2L, request);

        assertEquals("INACTIVE", user.getStatus());
        assertEquals(true, session.isRevoked());
        verify(loginSessionRepository).saveAll(List.of(session));
    }

    @Test
    void userPutDeactivationAlsoRevokesSessions() {
        AppUser user = user(2L);
        LoginSession session = session(2L);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(user));
        when(permissionService.currentUser()).thenReturn(new AppUserDetails(9L, "admin", "x", true,
                Set.of("ADMIN"), Set.of(), List.of()));
        when(userRepository.existsByUsernameAndIdNot("teacher", 2L)).thenReturn(false);
        when(userRepository.existsByEmailAndIdNot("teacher@example.test", 2L)).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);
        when(loginSessionRepository.findByUserIdAndRevokedFalse(2L)).thenReturn(List.of(session));

        var request = new com.schoolenterprise.identity.dto.UserRequest();
        request.setUsername("teacher");
        request.setEmail("teacher@example.test");
        request.setFullName("Teacher User");
        request.setStatus("INACTIVE");

        identityService.updateUser(2L, request);

        assertEquals("INACTIVE", user.getStatus());
        assertEquals(true, session.isRevoked());
        verify(loginSessionRepository).saveAll(List.of(session));
    }

    private AppUser user(Long id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setStatus("ACTIVE");
        return user;
    }

    private Staff staff(Long id, Long userId, String status, String category) {
        Staff staff = new Staff();
        staff.setId(id);
        staff.setUserId(userId);
        staff.setStatus(status);
        staff.setStaffCategory(category);
        return staff;
    }

    private LoginSession session(Long userId) {
        LoginSession session = new LoginSession();
        session.setUserId(userId);
        session.setRevoked(false);
        return session;
    }
}
