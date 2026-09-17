package com.schoolenterprise.staff.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping("/staff")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<List<Staff>> list() {
        return ApiResponse.ok(staffService.list());
    }

    @GetMapping("/staff/{id}")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<Staff> get(@PathVariable Long id) {
        return ApiResponse.ok(staffService.get(id));
    }

    @PostMapping("/staff")
    @RequirePermission(module = "staff", action = "create")
    public ApiResponse<Staff> create(@RequestBody Staff staff) {
        return ApiResponse.ok(staffService.save(staff));
    }

    @PutMapping("/staff/{id}")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<Staff> update(@PathVariable Long id, @RequestBody Staff staff) {
        staff.setId(id);
        return ApiResponse.ok(staffService.save(staff));
    }

    @GetMapping("/teacher-assignments")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<List<TeacherAssignment>> assignments() {
        return ApiResponse.ok(staffService.assignments());
    }

    @PostMapping("/teacher-assignments")
    @RequirePermission(module = "staff", action = "create")
    public ApiResponse<TeacherAssignment> saveAssignment(@RequestBody TeacherAssignment a) {
        return ApiResponse.ok(staffService.saveAssignment(a));
    }
}
