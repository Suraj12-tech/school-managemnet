package com.schoolenterprise.common.config;

import com.schoolenterprise.common.security.PermissionInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.cors.CorsConfiguration;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final PermissionInterceptor permissionInterceptor;
    private final Environment environment;
    private final String configuredOrigins;

    public WebConfig(PermissionInterceptor permissionInterceptor, Environment environment,
                     @Value("${app.cors.allowed-origin-patterns:}") String configuredOrigins) {
        this.permissionInterceptor = permissionInterceptor;
        this.environment = environment;
        this.configuredOrigins = configuredOrigins;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(permissionInterceptor);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").combine(corsConfiguration());
    }

    CorsConfiguration corsConfiguration() {
        boolean production = environment.acceptsProfiles(Profiles.of("prod", "production"));
        boolean development = environment.acceptsProfiles(Profiles.of("dev")) && !production;
        List<String> origins = Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .peek(origin -> validateOrigin(origin, development))
                .distinct()
                .toList();

        CorsConfiguration configuration = new CorsConfiguration();
        if (production) {
            configuration.setAllowedOrigins(origins);
        } else {
            List<String> localPatterns = List.of("http://localhost:*", "http://127.0.0.1:*");
            List<String> developmentPatterns = development
                    ? List.of("https://*.trycloudflare.com", "https://*.ngrok-free.app")
                    : List.of();
            configuration.setAllowedOriginPatterns(
                    java.util.stream.Stream.concat(
                            java.util.stream.Stream.concat(localPatterns.stream(), developmentPatterns.stream()),
                            origins.stream())
                            .toList());
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        return configuration;
    }

    private void validateOrigin(String origin, boolean development) {
        URI uri;
        try {
            uri = URI.create(origin);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid configured CORS origin: " + origin, exception);
        }
        String scheme = uri.getScheme();
        boolean allowedScheme = "https".equalsIgnoreCase(scheme)
                || (development && "http".equalsIgnoreCase(scheme));
        if (origin.contains("*") || !uri.isAbsolute() || !allowedScheme || uri.getHost() == null
                || uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null
                || (uri.getRawPath() != null && !uri.getRawPath().isEmpty())
                || uri.getPort() > 65535) {
            throw new IllegalStateException(
                    "CORS configuration must contain exact " + (development ? "frontend" : "HTTPS frontend")
                            + " origins without paths or wildcard patterns");
        }
    }
}
