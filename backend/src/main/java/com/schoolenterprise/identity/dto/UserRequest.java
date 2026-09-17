package com.schoolenterprise.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserRequest {
    @NotBlank(message = "username is required")
    @Size(max = 80, message = "username must be at most 80 characters")
    private String username;
    @NotBlank(message = "email is required")
    @Email(message = "email must be valid")
    @Size(max = 120, message = "email must be at most 120 characters")
    private String email;
    @Size(min = 8)
    private String password;
    @NotBlank(message = "fullName is required")
    @Size(max = 150, message = "fullName must be at most 150 characters")
    private String fullName;
    @Size(max = 30, message = "phone must be at most 30 characters")
    private String phone;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status;
    private List<Long> roleIds;
    @Valid
    private List<ScopeRequest> scopes;

    @Getter
    @Setter
    public static class ScopeRequest {
        @NotBlank(message = "scopeType is required")
        @Pattern(regexp = "SCHOOL|CAMPUS|CLASS|SECTION|SUBJECT|STUDENT|ASSIGNED_STUDENT",
                message = "scopeType is invalid")
        private String scopeType;
        @jakarta.validation.constraints.NotNull(message = "scopeId is required")
        @jakarta.validation.constraints.Positive(message = "scopeId must be positive")
        private Long scopeId;
    }
}
