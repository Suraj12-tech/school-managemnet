package com.schoolenterprise.auth.controller;

import com.schoolenterprise.auth.dto.ForgotPasswordRequest;
import com.schoolenterprise.auth.dto.LoginRequest;
import com.schoolenterprise.auth.dto.LoginResponse;
import com.schoolenterprise.auth.dto.ResetPasswordRequest;
import com.schoolenterprise.auth.service.AuthService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.login(request, http.getRemoteAddr()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String header) {
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Claims claims = jwtService.parse(token);
            authService.logout(claims.getId());
        }
        return ApiResponse.ok("Logged out", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        Map<String, String> result = authService.forgotPassword(request.getEmail());
        return ApiResponse.ok(result.get("message"), result);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> reset(@Valid @RequestBody ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw com.schoolenterprise.common.exception.AppException.badRequest("Passwords do not match");
        }
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.ok("Password updated", null);
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal AppUserDetails user) {
        return ApiResponse.ok(Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "roles", user.getRoles(),
                "permissions", user.getPermissions()
        ));
    }
}
