package com.schoolenterprise.student.controller;

import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import com.schoolenterprise.student.entity.*;
import com.schoolenterprise.student.service.StudentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

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
    public ApiResponse<Student> create(@RequestBody Student student) {
        return ApiResponse.ok(studentService.save(student));
    }

    @PutMapping("/students/{id}")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Student> update(@PathVariable Long id, @RequestBody Student student) {
        student.setId(id);
        return ApiResponse.ok(studentService.save(student));
    }

    @GetMapping("/guardians")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<Guardian>> guardians() {
        return ApiResponse.ok(studentService.guardians());
    }

    @PostMapping("/guardians")
    @RequirePermission(module = "students", action = "create")
    public ApiResponse<Guardian> saveGuardian(@RequestBody Guardian g) {
        return ApiResponse.ok(studentService.saveGuardian(g));
    }

    @PostMapping("/students/{id}/guardians")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<StudentGuardian> link(@PathVariable Long id, @RequestBody LinkBody body) {
        return ApiResponse.ok(studentService.linkGuardian(id, body.getGuardianId(), body.isPrimaryGuardian()));
    }

    @GetMapping("/students/{id}/guardians")
    @RequirePermission(module = "students", action = "view")
    public ApiResponse<List<StudentGuardian>> studentGuardians(@PathVariable Long id) {
        return ApiResponse.ok(studentService.studentGuardians(id));
    }

    @PostMapping("/enrollments")
    @RequirePermission(module = "students", action = "edit")
    public ApiResponse<Enrollment> enroll(@RequestBody EnrollBody body) {
        return ApiResponse.ok(studentService.enroll(body.getStudentId(), body.getSectionId(), body.getAcademicYearId()));
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
    public static class LinkBody {
        private Long guardianId;
        private boolean primaryGuardian;
    }

    @Data
    public static class EnrollBody {
        private Long studentId;
        private Long sectionId;
        private Long academicYearId;
    }
}
