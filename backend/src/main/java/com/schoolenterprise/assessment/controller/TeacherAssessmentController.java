package com.schoolenterprise.assessment.controller;

import com.schoolenterprise.assessment.dto.AssessmentResponse;
import com.schoolenterprise.assessment.service.AssessmentService;
import com.schoolenterprise.common.api.ApiResponse;
import com.schoolenterprise.common.security.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/assessments")
@RequiredArgsConstructor
@RequirePermission(module = "subjects", action = "view")
public class TeacherAssessmentController {
    private final AssessmentService assessmentService;

    @GetMapping
    public ApiResponse<List<AssessmentResponse>> assessments() {
        return ApiResponse.ok(assessmentService.teacherAssessments());
    }

    @GetMapping("/{id}")
    public ApiResponse<AssessmentResponse> assessment(@PathVariable Long id) {
        return ApiResponse.ok(assessmentService.teacherAssessment(id));
    }
}
