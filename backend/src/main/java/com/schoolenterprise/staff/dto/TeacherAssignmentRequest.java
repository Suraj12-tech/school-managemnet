package com.schoolenterprise.staff.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeacherAssignmentRequest {
    @NotNull @Positive
    private Long staffId;
    @Positive
    private Long subjectId;
    @NotNull @Positive
    private Long classId;
    @Positive
    private Long sectionId;
    @NotNull @Positive
    private Long academicYearId;
    @NotNull
    @Pattern(regexp = "SUBJECT_TEACHER|CLASS_TEACHER")
    private String assignmentType = "SUBJECT_TEACHER";
    @Pattern(regexp = "ACTIVE|INACTIVE")
    private String status = "ACTIVE";
}
