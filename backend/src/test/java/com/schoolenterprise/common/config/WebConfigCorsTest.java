package com.schoolenterprise.common.config;

import com.schoolenterprise.common.security.PermissionInterceptor;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.DefaultCorsProcessor;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebConfigCorsTest {
    @Test
    void productionAllowsOnlyConfiguredExactHttpsOrigins() {
        CorsConfiguration cors = configuration("prod",
                "https://teacher.example.org,https://admin.example.org");

        assertEquals("https://teacher.example.org", cors.checkOrigin("https://teacher.example.org"));
        assertEquals("https://admin.example.org", cors.checkOrigin("https://admin.example.org"));
        assertNull(cors.checkOrigin("https://untrusted.example.org"));
        assertNull(cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("https://abc.trycloudflare.com"));
        assertNull(cors.checkOrigin("https://abc.ngrok-free.app"));
    }

    @Test
    void productionPreflightAllowsConfiguredOriginAndExistingMethodsAndHeaders() throws Exception {
        CorsConfiguration cors = configuration("production", "https://teacher.example.org");
        MockHttpServletRequest request = preflight(
                "https://teacher.example.org", "PUT", "Authorization,Content-Type");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(new DefaultCorsProcessor().processRequest(cors, request, response));
        assertEquals("https://teacher.example.org", response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("PUT"));
        assertTrue(response.getHeader("Access-Control-Allow-Headers").contains("Authorization"));
    }

    @Test
    void productionPreflightRejectsUnapprovedOrigin() throws Exception {
        CorsConfiguration cors = configuration("prod", "https://teacher.example.org");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(new DefaultCorsProcessor().processRequest(
                cors, preflight("https://attacker.example.net", "GET", "Authorization"), response));
        assertEquals(403, response.getStatus());
        assertNull(response.getHeader("Access-Control-Allow-Origin"));
    }

    @Test
    void productionHasNoImplicitLocalhostOrTunnelAllowances() {
        CorsConfiguration cors = configuration("prod", "");

        assertTrue(cors.getAllowedOrigins() == null || cors.getAllowedOrigins().isEmpty());
        assertTrue(cors.getAllowedOriginPatterns() == null || cors.getAllowedOriginPatterns().isEmpty());
        assertNull(cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("http://127.0.0.1:8081"));
        assertNull(cors.checkOrigin("https://abc.trycloudflare.com"));
        assertNull(cors.checkOrigin("https://abc.ngrok-free.app"));
    }

    @Test
    void defaultProfileAllowsLocalhostButNotDevelopmentTunnelOrigins() {
        CorsConfiguration cors = configuration("", "");

        assertTrue(cors.getAllowedOrigins() == null || cors.getAllowedOrigins().isEmpty());
        assertEquals("http://localhost:5173", cors.checkOrigin("http://localhost:5173"));
        assertEquals("http://127.0.0.1:8081", cors.checkOrigin("http://127.0.0.1:8081"));
        assertNull(cors.checkOrigin("https://abc.trycloudflare.com"));
        assertNull(cors.checkOrigin("https://untrusted.example.org"));
    }

    @Test
    void defaultProfilePreflightAllowsLocalAdminFrontend() throws Exception {
        CorsConfiguration cors = configuration("", "");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(new DefaultCorsProcessor().processRequest(
                cors, preflight("http://localhost:5173", "POST", "Content-Type,Authorization"), response));
        assertEquals("http://localhost:5173", response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("true", response.getHeader("Access-Control-Allow-Credentials"));
        assertTrue(response.getHeader("Access-Control-Allow-Methods").contains("POST"));
    }

    @Test
    void productionProfileOverridesDevelopmentProfile() {
        CorsConfiguration cors = configuration("dev,prod", "");

        assertTrue(cors.getAllowedOrigins().isEmpty());
        assertTrue(cors.getAllowedOriginPatterns() == null || cors.getAllowedOriginPatterns().isEmpty());
        assertNull(cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("https://abc.trycloudflare.com"));
    }

    @Test
    void productionRejectsWildcardTunnelAndNonHttpsConfigurations() {
        assertThrows(IllegalStateException.class,
                () -> configuration("prod", "https://*.trycloudflare.com"));
        assertThrows(IllegalStateException.class,
                () -> configuration("prod", "*"));
        assertThrows(IllegalStateException.class,
                () -> configuration("production", "http://localhost:5173"));
        assertThrows(IllegalStateException.class,
                () -> configuration("prod", "https://teacher.example.org/app"));
    }

    @Test
    void developmentProfileKeepsLocalhostAndTunnelOriginPatterns() {
        CorsConfiguration cors = configuration("dev", "");

        assertEquals("http://localhost:5173", cors.checkOrigin("http://localhost:5173"));
        assertEquals("http://127.0.0.1:8081", cors.checkOrigin("http://127.0.0.1:8081"));
        assertEquals("https://abc.trycloudflare.com", cors.checkOrigin("https://abc.trycloudflare.com"));
        assertEquals("https://abc.ngrok-free.app", cors.checkOrigin("https://abc.ngrok-free.app"));
        assertEquals("https://suraj12-tech.github.io", cors.checkOrigin("https://suraj12-tech.github.io"));
    }

    private CorsConfiguration configuration(String profile, String configuredOrigins) {
        StandardEnvironment environment = new StandardEnvironment();
        if (!profile.isBlank()) {
            environment.setActiveProfiles(profile.split(","));
        }
        ExposedCorsRegistry registry = new ExposedCorsRegistry();
        new WebConfig(new PermissionInterceptor(null), environment, configuredOrigins)
                .addCorsMappings(registry);
        return registry.configurations().get("/**");
    }

    private MockHttpServletRequest preflight(String origin, String method, String headers) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("OPTIONS");
        request.addHeader("Origin", origin);
        request.addHeader("Access-Control-Request-Method", method);
        request.addHeader("Access-Control-Request-Headers", headers);
        return request;
    }

    private static class ExposedCorsRegistry extends CorsRegistry {
        Map<String, CorsConfiguration> configurations() {
            return getCorsConfigurations();
        }
    }
}
