package com.schoolenterprise.staff.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.dto.*;
import com.schoolenterprise.school.dto.StatusRequest;
import jakarta.validation.Valid;
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
    public ApiResponse<List<StaffResponse>> list() {
        return ApiResponse.ok(staffService.list());
    }

    @GetMapping("/staff/{id}")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<StaffProfileResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(staffService.profile(id));
    }

    @GetMapping("/staff/{id}/assignments")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<List<StaffProfileResponse.AssignmentResponse>> staffAssignments(@PathVariable Long id) {
        return ApiResponse.ok(staffService.profile(id).getAssignments());
    }

    @PostMapping("/staff")
    @RequirePermission(module = "staff", action = "create")
    public ApiResponse<StaffResponse> create(@Valid @RequestBody StaffRequest request) {
        return ApiResponse.ok(staffService.create(request));
    }

    @PutMapping("/staff/{id}")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<StaffResponse> update(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return ApiResponse.ok(staffService.update(id, request));
    }

    @PatchMapping("/staff/{id}/status")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<StaffResponse> updateStatus(@PathVariable Long id,
                                                    @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(staffService.updateStatus(id, request.getStatus()));
    }

    @GetMapping("/teacher-assignments")
    @RequirePermission(module = "staff", action = "view")
    public ApiResponse<List<TeacherAssignmentResponse>> assignments() {
        return ApiResponse.ok(staffService.assignments());
    }

    @PostMapping("/teacher-assignments")
    @RequirePermission(module = "staff", action = "create")
    public ApiResponse<TeacherAssignmentResponse> saveAssignment(@Valid @RequestBody TeacherAssignmentRequest request) {
        return ApiResponse.ok(staffService.createAssignment(request));
    }

    @PutMapping("/teacher-assignments/{id}")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<TeacherAssignmentResponse> updateAssignment(@PathVariable Long id,
                                                                    @Valid @RequestBody TeacherAssignmentRequest request) {
        return ApiResponse.ok(staffService.updateAssignment(id, request));
    }

    @PatchMapping("/teacher-assignments/{id}/status")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<TeacherAssignmentResponse> updateAssignmentStatus(@PathVariable Long id,
                                                                          @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(staffService.updateAssignmentStatus(id, request.getStatus()));
    }

    @DeleteMapping("/teacher-assignments/{id}")
    @RequirePermission(module = "staff", action = "edit")
    public ApiResponse<Void> unassign(@PathVariable Long id) {
        staffService.unassign(id);
        return ApiResponse.ok(null);
    }
}
