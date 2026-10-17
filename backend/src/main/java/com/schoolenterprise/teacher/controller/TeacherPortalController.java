package com.schoolenterprise.teacher.controller;

import com.schoolenterprise.academics.dto.TimetableEntryResponse;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.staff.dto.TeacherAssignmentResponse;
import com.schoolenterprise.teacher.dto.TeacherPortalResponse;
import com.schoolenterprise.teacher.dto.TeacherReportResponse;
import com.schoolenterprise.teacher.service.TeacherPortalService;
import com.schoolenterprise.teacher.service.TeacherReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherPortalController {
    private final TeacherPortalService teacherPortalService;
    private final TeacherReportsService teacherReportsService;

    @GetMapping("/profile")
    @RequirePermission(module = "dashboard", action = "view")
    public ApiResponse<TeacherPortalResponse.Profile> profile() {
        return ApiResponse.ok(teacherPortalService.profile());
    }

    @GetMapping("/assignments")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TeacherAssignmentResponse>> assignments(
            @RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(teacherPortalService.assignments(academicYearId));
    }

    @GetMapping("/assignments/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<TeacherAssignmentResponse> assignment(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.assignment(id));
    }

    @GetMapping("/classes")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TeacherPortalResponse.SchoolClassView>> classes() {
        return ApiResponse.ok(teacherPortalService.classes());
    }

    @GetMapping("/classes/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<TeacherPortalResponse.SchoolClassView> schoolClass(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.schoolClass(id));
    }

    @GetMapping("/sections")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TeacherPortalResponse.SectionView>> sections() {
        return ApiResponse.ok(teacherPortalService.sections());
    }

    @GetMapping("/sections/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<TeacherPortalResponse.SectionView> section(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.section(id));
    }

    @GetMapping("/sections/{id}/students")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<TeacherPortalResponse.StudentRosterEntry>> students(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.students(id));
    }

    @GetMapping("/students/{id}")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<TeacherPortalResponse.StudentRosterEntry> student(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.student(id));
    }

    @GetMapping("/subjects")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<List<TeacherPortalResponse.SubjectView>> subjects() {
        return ApiResponse.ok(teacherPortalService.subjects());
    }

    @GetMapping("/subjects/{id}")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<TeacherPortalResponse.SubjectView> subject(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.subject(id));
    }

    @GetMapping("/academic-years")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TeacherPortalResponse.AcademicYearView>> academicYears() {
        return ApiResponse.ok(teacherPortalService.academicYears());
    }

    @GetMapping("/academic-years/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<TeacherPortalResponse.AcademicYearView> academicYear(@PathVariable Long id) {
        return ApiResponse.ok(teacherPortalService.academicYear(id));
    }

    @GetMapping("/timetable")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TimetableEntryResponse>> timetable(
            @RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(teacherPortalService.timetable(academicYearId));
    }

    @GetMapping("/reports")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<TeacherReportResponse> reports(
            @RequestParam Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ApiResponse.ok(teacherReportsService.report(sectionId, fromDate, toDate));
    }
}
