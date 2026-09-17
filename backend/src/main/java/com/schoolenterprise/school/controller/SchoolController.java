package com.schoolenterprise.school.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.school.dto.AcademicYearRequest;
import com.schoolenterprise.school.dto.StatusRequest;
import com.schoolenterprise.school.dto.TermRequest;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.Campus;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.entity.Term;
import com.schoolenterprise.school.service.SchoolService;
import jakarta.validation.Valid;
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

    @GetMapping("/academic-years/{id}")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<AcademicYear> year(@PathVariable Long id) {
        return ApiResponse.ok(schoolService.year(id));
    }

    @PostMapping("/academic-years")
    @RequirePermission(module = "school", action = "create")
    public ApiResponse<AcademicYear> saveYear(@Valid @RequestBody AcademicYearRequest request) {
        return ApiResponse.ok(schoolService.saveYear(null, request));
    }

    @PutMapping("/academic-years/{id}")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<AcademicYear> updateYear(@PathVariable Long id,
                                                @Valid @RequestBody AcademicYearRequest request) {
        return ApiResponse.ok(schoolService.saveYear(id, request));
    }

    @PostMapping("/academic-years/{id}/current")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<AcademicYear> current(@PathVariable Long id) {
        return ApiResponse.ok(schoolService.setCurrentYear(id));
    }

    @PatchMapping("/academic-years/{id}/status")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<AcademicYear> updateYearStatus(@PathVariable Long id,
                                                      @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(schoolService.updateYearStatus(id, request.getStatus()));
    }

    @GetMapping("/terms")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<List<Term>> terms(@RequestParam(required = false) Long academicYearId) {
        return ApiResponse.ok(schoolService.terms(academicYearId));
    }

    @GetMapping("/terms/{id}")
    @RequirePermission(module = "school", action = "view")
    public ApiResponse<Term> term(@PathVariable Long id) {
        Term term = schoolService.term(id);
        schoolService.year(term.getAcademicYearId());
        return ApiResponse.ok(term);
    }

    @PostMapping("/terms")
    @RequirePermission(module = "school", action = "create")
    public ApiResponse<Term> saveTerm(@Valid @RequestBody TermRequest request) {
        return ApiResponse.ok(schoolService.saveTerm(null, request));
    }

    @PutMapping("/terms/{id}")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<Term> updateTerm(@PathVariable Long id, @Valid @RequestBody TermRequest request) {
        return ApiResponse.ok(schoolService.saveTerm(id, request));
    }

    @PatchMapping("/terms/{id}/status")
    @RequirePermission(module = "school", action = "edit")
    public ApiResponse<Term> updateTermStatus(@PathVariable Long id,
                                              @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(schoolService.updateTermStatus(id, request.getStatus()));
    }

    @DeleteMapping("/terms/{id}")
    @RequirePermission(module = "school", action = "delete")
    public ApiResponse<Void> deleteTerm(@PathVariable Long id) {
        schoolService.deleteTerm(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/terms/{id}/delete")
    @RequirePermission(module = "school", action = "delete")
    public ApiResponse<Void> deleteTermByPost(@PathVariable Long id) {
        schoolService.deleteTerm(id);
        return ApiResponse.ok(null);
    }
}
