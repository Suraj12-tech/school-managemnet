package com.schoolenterprise.auth.service;

import com.schoolenterprise.identity.entity.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResetEmailService {
    private final JavaMailSender mailSender;

    @Value("${app.auth.reset-email-enabled:false}")
    private boolean enabled;
    @Value("${app.auth.reset-url:http://localhost:5173/login}")
    private String resetUrl;
    @Value("${spring.mail.username:}")
    private String from;

    public void send(AppUser user, String token) {
        if (!enabled) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Password reset email is not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setSubject("School Enterprise password reset");
        message.setText("Use this reset token in the application: " + token
                + "\nReset page: " + resetUrl);
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw com.schoolenterprise.common.exception.AppException.badRequest(
                    "Password reset email could not be sent");
        }
    }
}
