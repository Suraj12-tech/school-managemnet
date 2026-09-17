package com.schoolenterprise.academics.controller;

import com.schoolenterprise.academics.entity.Department;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.entity.SubjectClassMapping;
import com.schoolenterprise.academics.dto.DepartmentDetail;
import com.schoolenterprise.academics.dto.DepartmentRequest;
import com.schoolenterprise.academics.dto.DepartmentSummary;
import com.schoolenterprise.academics.dto.SchoolClassRequest;
import com.schoolenterprise.academics.dto.SectionDetailResponse;
import com.schoolenterprise.academics.dto.SectionRequest;
import com.schoolenterprise.academics.dto.SectionSummary;
import com.schoolenterprise.academics.dto.SubjectClassMappingRequest;
import com.schoolenterprise.academics.dto.SubjectClassMappingView;
import com.schoolenterprise.academics.dto.SubjectDetail;
import com.schoolenterprise.academics.dto.SubjectRequest;
import com.schoolenterprise.academics.dto.SubjectSummary;
import com.schoolenterprise.academics.dto.TimetableEntryRequest;
import com.schoolenterprise.academics.dto.TimetableEntryResponse;
import com.schoolenterprise.school.dto.StatusRequest;
import com.schoolenterprise.academics.service.AcademicsService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AcademicsController {

    private final AcademicsService academicsService;

    @GetMapping("/departments")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<DepartmentSummary>> departments() {
        return ApiResponse.ok(academicsService.departments());
    }

    @GetMapping("/departments/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<DepartmentDetail> department(@PathVariable Long id) {
        return ApiResponse.ok(academicsService.department(id));
    }

    @PostMapping("/departments")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<Department> saveDept(@Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.ok(academicsService.saveDepartment(null, request));
    }

    @PutMapping("/departments/{id}")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<Department> updateDept(@PathVariable Long id,
                                              @Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.ok(academicsService.saveDepartment(id, request));
    }

    @PatchMapping("/departments/{id}/status")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<Department> updateDeptStatus(@PathVariable Long id,
                                                    @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(academicsService.updateDepartmentStatus(id, request.getStatus()));
    }

    @DeleteMapping("/departments/{id}")
    @RequirePermission(module = "classes", action = "delete")
    public ApiResponse<Void> deleteDept(@PathVariable Long id) {
        academicsService.deleteDepartment(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/subjects")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<List<SubjectSummary>> subjects() {
        return ApiResponse.ok(academicsService.subjects());
    }

    @GetMapping("/subjects/{id}")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<SubjectDetail> subject(@PathVariable Long id) {
        return ApiResponse.ok(academicsService.subject(id));
    }

    @PostMapping("/subjects")
    @RequirePermission(module = "subjects", action = "create")
    public ApiResponse<Subject> saveSubject(@Valid @RequestBody SubjectRequest request) {
        return ApiResponse.ok(academicsService.saveSubject(null, request));
    }

    @PutMapping("/subjects/{id}")
    @RequirePermission(module = "subjects", action = "edit")
    public ApiResponse<Subject> updateSubject(@PathVariable Long id,
                                              @Valid @RequestBody SubjectRequest request) {
        return ApiResponse.ok(academicsService.saveSubject(id, request));
    }

    @PatchMapping("/subjects/{id}/status")
    @RequirePermission(module = "subjects", action = "edit")
    public ApiResponse<Subject> updateSubjectStatus(@PathVariable Long id,
                                                    @Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(academicsService.updateSubjectStatus(id, request.getStatus()));
    }

    @DeleteMapping("/subjects/{id}")
    @RequirePermission(module = "subjects", action = "delete")
    public ApiResponse<Void> deleteSubject(@PathVariable Long id) {
        academicsService.deleteSubject(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/subjects/{id}/classes")
    @RequirePermission(module = "subjects", action = "edit")
    public ApiResponse<SubjectClassMapping> mapSubjectToClass(@PathVariable Long id,
                                                              @Valid @RequestBody SubjectClassMappingRequest request) {
        return ApiResponse.ok(academicsService.mapSubjectToClass(id, request));
    }

    @DeleteMapping("/subjects/{subjectId}/classes/{classId}")
    @RequirePermission(module = "subjects", action = "edit")
    public ApiResponse<Void> removeSubjectClass(@PathVariable Long subjectId,
                                                @PathVariable Long classId,
                                                @RequestParam Long academicYearId) {
        academicsService.removeSubjectClassMapping(subjectId, classId, academicYearId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/subjects/{id}/classes")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<List<SubjectClassMappingView>> subjectClasses(@PathVariable Long id) {
        return ApiResponse.ok(academicsService.classesForSubject(id));
    }

    @GetMapping("/classes/{classId}/subjects")
    @RequirePermission(module = "subjects", action = "view")
    public ApiResponse<List<SubjectSummary>> classSubjects(@PathVariable Long classId,
                                                           @RequestParam Long academicYearId) {
        return ApiResponse.ok(academicsService.subjectsForClass(classId, academicYearId));
    }

    @GetMapping("/classes")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<SchoolClass>> classes() {
        return ApiResponse.ok(academicsService.classes());
    }

    @PostMapping("/classes")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<SchoolClass> saveClass(@Valid @RequestBody SchoolClassRequest request) {
        SchoolClass c = new SchoolClass();
        c.setName(request.getName());
        c.setNumberOfClassrooms(request.getNumberOfClassrooms());
        return ApiResponse.ok(academicsService.saveClass(c));
    }

    @GetMapping("/sections")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<SectionSummary>> sections() {
        return ApiResponse.ok(academicsService.sections());
    }

    @GetMapping("/sections/{id}/detail")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<SectionDetailResponse> sectionDetail(@PathVariable Long id) {
        return ApiResponse.ok(academicsService.sectionDetail(id));
    }

    @PostMapping("/sections")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<Section> saveSection(@Valid @RequestBody SectionRequest request) {
        Section s = new Section();
        s.setClassId(request.getClassId());
        s.setAcademicYearId(request.getAcademicYearId());
        s.setName(request.getName());
        s.setClassTeacherStaffId(request.getClassTeacherStaffId());
        s.setStatus(request.getStatus());
        return ApiResponse.ok(academicsService.saveSection(s));
    }

    @PutMapping("/sections/{id}")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<Section> updateSection(@PathVariable Long id,
                                              @Valid @RequestBody SectionRequest request) {
        Section s = new Section();
        s.setId(id);
        s.setClassId(request.getClassId());
        s.setAcademicYearId(request.getAcademicYearId());
        s.setName(request.getName());
        s.setClassTeacherStaffId(request.getClassTeacherStaffId());
        s.setStatus(request.getStatus());
        return ApiResponse.ok(academicsService.saveSection(s));
    }

    @PatchMapping("/sections/{id}/status")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<Section> updateSectionStatus(@PathVariable Long id,
                                                     @jakarta.validation.Valid @RequestBody StatusRequest request) {
        return ApiResponse.ok(academicsService.updateSectionStatus(id, request.getStatus()));
    }

    @DeleteMapping("/sections/{id}")
    @RequirePermission(module = "classes", action = "delete")
    public ApiResponse<Void> deleteSection(@PathVariable Long id) {
        academicsService.deleteSection(id);
        return ApiResponse.ok(null);
    }

    // ================= Timetable Endpoints =================

    @GetMapping("/timetable")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<List<TimetableEntryResponse>> timetableEntries(
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Long staffId) {
        return ApiResponse.ok(academicsService.timetableEntries(sectionId, classId, academicYearId, staffId));
    }

    @GetMapping("/timetable/{id}")
    @RequirePermission(module = "classes", action = "view")
    public ApiResponse<TimetableEntryResponse> timetableEntry(@PathVariable Long id) {
        return ApiResponse.ok(academicsService.timetableEntry(id));
    }

    @PostMapping("/timetable")
    @RequirePermission(module = "classes", action = "create")
    public ApiResponse<TimetableEntryResponse> createTimetableEntry(@Valid @RequestBody TimetableEntryRequest request) {
        return ApiResponse.ok(academicsService.saveTimetableEntry(null, request));
    }

    @PutMapping("/timetable/{id}")
    @RequirePermission(module = "classes", action = "edit")
    public ApiResponse<TimetableEntryResponse> updateTimetableEntry(@PathVariable Long id,
                                                                    @Valid @RequestBody TimetableEntryRequest request) {
        return ApiResponse.ok(academicsService.saveTimetableEntry(id, request));
    }

    @DeleteMapping("/timetable/{id}")
    @RequirePermission(module = "classes", action = "delete")
    public ApiResponse<Void> deleteTimetableEntry(@PathVariable Long id) {
        academicsService.deleteTimetableEntry(id);
        return ApiResponse.ok(null);
    }
}
