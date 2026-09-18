package com.schoolenterprise.auth.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.auth.dto.LoginRequest;
import com.schoolenterprise.auth.dto.LoginResponse;
import com.schoolenterprise.auth.dto.ChangePasswordRequest;
import com.schoolenterprise.auth.dto.ProfileUpdateRequest;
import com.schoolenterprise.auth.entity.LoginSession;
import com.schoolenterprise.auth.repository.LoginSessionRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.JwtService;
import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final LoginSessionRepository loginSessionRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final ResetEmailService resetEmailService;

    @Transactional
    public LoginResponse login(LoginRequest request, String ip) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        AppUserDetails user = (AppUserDetails) authentication.getPrincipal();

        String tokenId = UUID.randomUUID().toString();
        String jwt = jwtService.createToken(user.getUserId(), user.getUsername(), tokenId);

        LoginSession session = new LoginSession();
        session.setUserId(user.getUserId());
        session.setTokenId(tokenId);
        session.setIpAddress(ip);
        session.setExpiresAt(LocalDateTime.now().plusSeconds(jwtService.getExpirationMs() / 1000));
        session.setRevoked(false);
        loginSessionRepository.save(session);

        auditService.record("users", "login", "AppUser", user.getUserId(), "Login success");

        AppUser dbUser = userRepository.findById(user.getUserId()).orElseThrow();
        return LoginResponse.builder()
                .token(jwt)
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(dbUser.getFullName())
                .email(dbUser.getEmail())
                .phone(dbUser.getPhone())
                .status(dbUser.getStatus())
                .roles(user.getRoles())
                .permissions(user.getPermissions())
                .build();
    }

    @Transactional
    public void logout(String tokenId) {
        loginSessionRepository.findByTokenId(tokenId).ifPresent(session -> {
            session.setRevoked(true);
            loginSessionRepository.save(session);
            auditService.record("users", "logout", "AppUser", session.getUserId(), "Logout");
        });
    }

    @Transactional
    public java.util.Map<String, String> forgotPassword(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("No user with that email"));
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(2));
        userRepository.save(user);
        auditService.record("users", "forgot-password", "AppUser", user.getId(), "Reset token created");
        resetEmailService.send(user, token);
        return java.util.Map.of("message", "Password reset instructions sent to your email");
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw AppException.badRequest("Reset token is required");
        }
        AppUser user = userRepository.findByResetToken(token.trim())
                .orElseThrow(() -> AppException.badRequest("Invalid reset token"));
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw AppException.badRequest("Reset token has expired");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.saveAndFlush(user);
        if (!passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw AppException.badRequest("Password could not be updated");
        }
        loginSessionRepository.findByUserIdAndRevokedFalse(user.getId()).forEach(session -> {
            session.setRevoked(true);
            loginSessionRepository.save(session);
        });
        auditService.record("users", "reset-password", "AppUser", user.getId(), "Password changed");
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> currentProfile(AppUserDetails principal) {
        AppUser user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> AppException.notFound("User not found"));
        return profileMap(user, principal);
    }

    @Transactional
    public java.util.Map<String, Object> updateProfile(AppUserDetails principal, ProfileUpdateRequest request) {
        AppUser user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> AppException.notFound("User not found"));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        AppUser saved = userRepository.save(user);
        auditService.record("users", "edit", "AppUser", saved.getId(), "Self-service profile updated");
        return profileMap(saved, principal);
    }

    @Transactional
    public void changePassword(AppUserDetails principal, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw AppException.badRequest("Passwords do not match");
        }
        AppUser user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> AppException.notFound("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw AppException.badRequest("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw AppException.badRequest("New password must be different from the current password");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.record("users", "edit", "AppUser", user.getId(), "Self-service password changed");
    }

    private java.util.Map<String, Object> profileMap(AppUser user, AppUserDetails principal) {
        return java.util.Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "status", user.getStatus(),
                "roles", principal.getRoles(),
                "permissions", principal.getPermissions()
        );
    }
}
