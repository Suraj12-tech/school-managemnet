package com.schoolenterprise.common.security;

import com.schoolenterprise.identity.entity.UserScope;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
public class AppUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String password;
    private final boolean active;
    private final Set<String> roles;
    private final Set<String> permissions;
    private final List<UserScope> scopes;

    public AppUserDetails(Long userId, String username, String password, boolean active,
                          Set<String> roles, Set<String> permissions, List<UserScope> scopes) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.active = active;
        this.roles = roles;
        this.permissions = permissions;
        this.scopes = scopes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
