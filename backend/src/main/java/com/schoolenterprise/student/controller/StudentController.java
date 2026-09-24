package com.schoolenterprise.student.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.student.dto.*;
import com.schoolenterprise.student.entity.*;
import com.schoolenterprise.student.service.StudentService;
import com.schoolenterprise.student.service.PromotionService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final PromotionService promotionService;

    @GetMapping("/students")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<Student>> list() {
        return ApiResponse.ok(studentService.list());
    }

    @GetMapping("/students/{id}")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<Student> get(@PathVariable Long id) {
        return ApiResponse.ok(studentService.get(id));
    }

    @PostMapping("/students")
    @RequirePermission(module = "students", action = "create")
    public ApiResponse<Student> create(@Valid @RequestBody StudentRequest request) {
        return ApiResponse.ok(studentService.create(request));
    }

    @PutMapping("/students/{id}")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Student> update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return ApiResponse.ok(studentService.update(id, request));
    }

    @PatchMapping("/students/{id}/status")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Student> updateStatus(@PathVariable Long id,
                                              @Valid @RequestBody StatusBody body) {
        return ApiResponse.ok(studentService.updateStatus(id, body.status));
    }

    @GetMapping("/guardians")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<GuardianSummary>> guardians() {
        return ApiResponse.ok(studentService.guardians());
    }

    @GetMapping("/guardians/{id}")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<GuardianDetailsResponse> guardian(@PathVariable Long id) {
        return ApiResponse.ok(studentService.guardianDetails(id));
    }

    @PostMapping("/guardians")
    @RequirePermission(module = "students", action = "create")
    public ApiResponse<Guardian> saveGuardian(@Valid @RequestBody GuardianRequest request) {
        return ApiResponse.ok(studentService.saveGuardian(request));
    }

    @PutMapping("/guardians/{id}")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Guardian> updateGuardian(@PathVariable Long id, @Valid @RequestBody GuardianRequest request) {
        return ApiResponse.ok(studentService.updateGuardian(id, request));
    }

    @PatchMapping("/guardians/{id}/status")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Guardian> updateGuardianStatus(@PathVariable Long id,
                                                       @Valid @RequestBody GuardianStatusRequest request) {
        return ApiResponse.ok(studentService.updateGuardianStatus(id, request.getStatus()));
    }

    @GetMapping("/guardians/{id}/students")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<LinkedStudentResponse>> guardianStudents(@PathVariable Long id) {
        return ApiResponse.ok(studentService.guardianStudents(id));
    }

    @PostMapping("/students/{id}/guardians")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<StudentGuardianResponse> link(@PathVariable Long id,
                                                     @Valid @RequestBody LinkGuardianRequest request) {
        return ApiResponse.ok(studentService.linkGuardian(id, request));
    }

    @GetMapping("/students/{id}/guardians")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<StudentGuardianResponse>> studentGuardians(@PathVariable Long id) {
        return ApiResponse.ok(studentService.studentGuardians(id));
    }

    @DeleteMapping("/students/{studentId}/guardians/{guardianId}")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Void> unlink(@PathVariable Long studentId, @PathVariable Long guardianId) {
        studentService.unlinkGuardian(studentId, guardianId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/enrollments")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Enrollment> enroll(@Valid @RequestBody EnrollmentRequest request) {
        return ApiResponse.ok(studentService.enroll(request));
    }

    @PostMapping("/student-promotions/preview")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<PromotionPreview> promotionPreview(@Valid @RequestBody PromotionRequest request) {
        return ApiResponse.ok(promotionService.preview(request));
    }

    @PostMapping("/student-promotions/confirm")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<PromotionSummary> confirmPromotion(@Valid @RequestBody PromotionRequest request) {
        return ApiResponse.ok(promotionService.confirm(request));
    }

    @GetMapping("/students/{id}/enrollments")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<Enrollment>> enrollments(@PathVariable Long id) {
        return ApiResponse.ok(studentService.enrollments(id));
    }

    @GetMapping("/students/{id}/history")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<ClassHistory>> history(@PathVariable Long id) {
        return ApiResponse.ok(studentService.history(id));
    }

    @GetMapping("/students/{id}/documents")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<StudentDocument>> docs(@PathVariable Long id) {
        return ApiResponse.ok(studentService.documents(id));
    }

    @PostMapping("/students/{id}/documents")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<StudentDocument> addDoc(@PathVariable Long id, @RequestBody StudentDocument doc) {
        doc.setStudentId(id);
        return ApiResponse.ok(studentService.addDocument(doc));
    }

    @Data
    public static class StatusBody {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Pattern(regexp = "ACTIVE|INACTIVE")
        private String status;
    }
}
