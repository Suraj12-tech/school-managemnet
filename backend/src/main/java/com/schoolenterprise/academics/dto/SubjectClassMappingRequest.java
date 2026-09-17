package com.schoolenterprise.academics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubjectClassMappingRequest {
    @NotNull(message = "Class is required")
    private Long classId;
    @NotNull(message = "Academic year is required")
    private Long academicYearId;
}
