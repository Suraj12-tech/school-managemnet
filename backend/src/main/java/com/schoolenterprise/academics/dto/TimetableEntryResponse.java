package com.schoolenterprise.academics.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimetableEntryResponse {
    private Long id;
    private Long schoolId;
    private Long classId;
    private String className;
    private Long sectionId;
    private String sectionName;
    private Long academicYearId;
    private String academicYearName;
    private String dayOfWeek;
    private Integer periodNumber;
    private String periodName;
    private String startTime;
    private String endTime;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Long staffId;
    private String teacherName;
    private String room;
    private String status;
}
