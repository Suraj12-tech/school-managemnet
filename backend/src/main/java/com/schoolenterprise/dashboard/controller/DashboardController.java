package com.schoolenterprise.dashboard.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.dashboard.service.DashboardService;
import com.schoolenterprise.finance.entity.Invoice;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @RequirePermission(module = "dashboard", action = "view")
    public ApiResponse<Map<String, Object>> summary() {
        return ApiResponse.ok(dashboardService.summary());
    }

    @GetMapping("/pending")
    @RequirePermission(module = "dashboard", action = "view")
    public ApiResponse<List<Invoice>> pending() {
        return ApiResponse.ok(dashboardService.pendingInvoices());
    }
}
