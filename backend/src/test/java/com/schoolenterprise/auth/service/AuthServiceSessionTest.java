package com.schoolenterprise.auth.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.auth.dto.LoginRequest;
import com.schoolenterprise.auth.entity.LoginSession;
import com.schoolenterprise.auth.repository.LoginSessionRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.JwtService;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceSessionTest {
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private LoginSessionRepository loginSessionRepository;
    @Mock private AppUserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;
    @Mock private ResetEmailService resetEmailService;

    @Test
    void loginRechecksAccountStatusUnderUserLockBeforeIssuingSession() {
        Authentication authentication = mock(Authentication.class);
        AppUserDetails authenticated = new AppUserDetails(2L, "teacher", "hash", true,
                Set.of("CLASS_TEACHER"), Set.of(), List.of());
        AppUser deactivated = new AppUser();
        deactivated.setId(2L);
        deactivated.setStatus("INACTIVE");
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(authenticated);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(deactivated));

        LoginRequest request = new LoginRequest();
        request.setUsername("teacher");
        request.setPassword("password");

        assertThrows(AppException.class, () -> service().login(request, "127.0.0.1"));

        verify(userRepository).findByIdForUpdate(2L);
        verify(loginSessionRepository, never()).save(any(LoginSession.class));
    }

    private AuthService service() {
        return new AuthService(authenticationManager, jwtService, loginSessionRepository, userRepository,
                passwordEncoder, auditService, resetEmailService);
    }
}
