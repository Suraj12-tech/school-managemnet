package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class DepartmentDetail {
    private DepartmentSummary department;
    private List<SubjectSummary> subjects;
}
