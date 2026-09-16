package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubjectClassMappingView {
    private Long id;
    private Long subjectId;
    private Long classId;
    private String className;
    private Long academicYearId;
    private String academicYearName;
}
