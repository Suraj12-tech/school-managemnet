package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SubjectDetail {
    private SubjectSummary subject;
    private List<SubjectClassMappingView> classMappings;
    private List<String> assignedTeacherNames;
}
