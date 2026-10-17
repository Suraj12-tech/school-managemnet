package com.schoolenterprise.assessment.controller;

import com.schoolenterprise.assessment.dto.AssessmentRequest;
import com.schoolenterprise.assessment.dto.AssessmentResponse;
import com.schoolenterprise.assessment.service.AssessmentService;
import com.schoolenterprise.common.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/assessments")
@RequiredArgsConstructor
public class AdminAssessmentController {
    private final AssessmentService assessmentService;

    @PostMapping
    public ApiResponse<AssessmentResponse> create(@Valid @RequestBody AssessmentRequest request) {
        return ApiResponse.ok(assessmentService.create(request));
    }
}
