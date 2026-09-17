package com.schoolenterprise.academics.controller;

import com.schoolenterprise.academics.entity.Department;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.service.AcademicsService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AcademicsController {

    private final AcademicsService academicsService;

    @GetMapping("/departments")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<Department>> departments() {
        return ApiResponse.ok(academicsService.departments());
    }

    @PostMapping("/departments")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<Department> saveDept(@RequestBody Department d) {
        return ApiResponse.ok(academicsService.saveDepartment(d));
    }

    @GetMapping("/subjects")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<List<Subject>> subjects() {
        return ApiResponse.ok(academicsService.subjects());
    }

    @PostMapping("/subjects")
    @RequirePermission(module = "subjects", action = "create")
    public ApiResponse<Subject> saveSubject(@RequestBody Subject s) {
        return ApiResponse.ok(academicsService.saveSubject(s));
    }

    @PutMapping("/subjects/{id}")
    @RequirePermission(module = "subjects", action = "edit")
    public ApiResponse<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject s) {
        s.setId(id);
        return ApiResponse.ok(academicsService.saveSubject(s));
    }

    @GetMapping("/classes")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<SchoolClass>> classes() {
        return ApiResponse.ok(academicsService.classes());
    }

    @PostMapping("/classes")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<SchoolClass> saveClass(@RequestBody SchoolClass c) {
        return ApiResponse.ok(academicsService.saveClass(c));
    }

    @GetMapping("/sections")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<Section>> sections() {
        return ApiResponse.ok(academicsService.sections());
    }

    @PostMapping("/sections")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<Section> saveSection(@RequestBody Section s) {
        return ApiResponse.ok(academicsService.saveSection(s));
    }

    @PutMapping("/sections/{id}")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<Section> updateSection(@PathVariable Long id, @RequestBody Section s) {
        s.setId(id);
        return ApiResponse.ok(academicsService.saveSection(s));
    }
}
