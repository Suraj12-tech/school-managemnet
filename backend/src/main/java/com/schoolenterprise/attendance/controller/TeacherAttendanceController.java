package com.schoolenterprise.attendance.controller;

import com.schoolenterprise.attendance.dto.TeacherAttendanceRequest;
import com.schoolenterprise.attendance.dto.TeacherAttendanceResponse;
import com.schoolenterprise.attendance.service.TeacherAttendanceService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/teacher/attendance")
@RequiredArgsConstructor
@RequirePermission(module = "students", action = "view")
public class TeacherAttendanceController {
    private final TeacherAttendanceService attendanceService;

    @GetMapping
    public ApiResponse<TeacherAttendanceResponse> attendance(
            @RequestParam Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(attendanceService.attendance(sectionId, date));
    }

    @PutMapping
    public ApiResponse<TeacherAttendanceResponse> save(@Valid @RequestBody TeacherAttendanceRequest request) {
        return ApiResponse.ok(attendanceService.save(request));
    }
}
