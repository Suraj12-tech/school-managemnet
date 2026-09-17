package com.schoolenterprise.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserRequest {
    @NotBlank
    private String username;
    @NotBlank
    @Email
    private String email;
    @Size(min = 8)
    private String password;
    @NotBlank
    private String fullName;
    private String phone;
    private String status;
    private List<Long> roleIds;
    private List<ScopeRequest> scopes;

    @Getter
    @Setter
    public static class ScopeRequest {
        private String scopeType;
        private Long scopeId;
    }
}
