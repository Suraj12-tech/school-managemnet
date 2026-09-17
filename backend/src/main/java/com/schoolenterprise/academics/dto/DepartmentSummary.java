package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DepartmentSummary {
    private Long id;
    private Long schoolId;
    private String name;
    private String code;
    private String description;
    private String status;
    private long subjectCount;
    private long staffCount;
}
