package com.schoolenterprise.common.security;

import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Permission;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.UserScopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;
    private final UserScopeRepository userScopeRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = userRepository.findByUsernameOrEmailWithRoles(username.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Set<String> roles = new HashSet<>();
        Set<String> permissions = new HashSet<>();
        Set<String> sensitivities = new HashSet<>();
        for (Role role : user.getRoles()) {
            roles.add(role.getName());
            if (role.getSensitivity() != null) {
                sensitivities.add(role.getSensitivity());
            }
            for (Permission permission : role.getPermissions()) {
                permissions.add(permission.getModuleName() + ":" + permission.getActionName());
            }
        }

        return new AppUserDetails(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                "ACTIVE".equals(user.getStatus()),
                roles,
                permissions,
                sensitivities,
                userScopeRepository.findByUserId(user.getId())
        );
    }
}
