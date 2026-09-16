package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SubjectSummary {
    private Long id;
    private Long schoolId;
    private Long departmentId;
    private String departmentName;
    private String name;
    private String code;
    private String description;
    private String status;
    private List<Long> classIds;
}
