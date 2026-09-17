package com.schoolenterprise.school.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.Campus;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.entity.Term;
import com.schoolenterprise.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping("/school")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<School> getSchool() {
        return ApiResponse.ok(schoolService.getSchool());
    }

    @PutMapping("/school")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<School> saveSchool(@RequestBody School school) {
        return ApiResponse.ok(schoolService.saveSchool(school));
    }

    @GetMapping("/campuses")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<List<Campus>> campuses() {
        return ApiResponse.ok(schoolService.campuses());
    }

    @PostMapping("/campuses")
    @RequirePermission(module = "school", action = "create")
    public ApiResponse<Campus> saveCampus(@RequestBody Campus campus) {
        return ApiResponse.ok(schoolService.saveCampus(campus));
    }

    @GetMapping("/academic-years")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<List<AcademicYear>> years() {
        return ApiResponse.ok(schoolService.years());
    }

    @PostMapping("/academic-years")
    @RequirePermission(module = "school", action = "create")
    public ApiResponse<AcademicYear> saveYear(@RequestBody AcademicYear year) {
        return ApiResponse.ok(schoolService.saveYear(year));
    }

    @PutMapping("/academic-years/{id}")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<AcademicYear> updateYear(@PathVariable Long id, @RequestBody AcademicYear year) {
        year.setId(id);
        return ApiResponse.ok(schoolService.saveYear(year));
    }

    @PostMapping("/academic-years/{id}/current")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<AcademicYear> current(@PathVariable Long id) {
        return ApiResponse.ok(schoolService.setCurrentYear(id));
    }

    @GetMapping("/terms")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<List<Term>> terms(@RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(schoolService.terms(academicYearId));
    }

    @PostMapping("/terms")
    @RequirePermission(module = "school", action = "create")
    public ApiResponse<Term> saveTerm(@RequestBody Term term) {
        return ApiResponse.ok(schoolService.saveTerm(term));
    }
}
