package com.schoolenterprise.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Put this on a controller method. The interceptor checks it on the server
 * (not only in the UI). Example: @RequirePermission(module = "students", action = "view")
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String module();
    String action();
}
