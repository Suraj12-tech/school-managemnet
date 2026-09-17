package com.schoolenterprise.academics.dto;

import com.schoolenterprise.staff.dto.TeacherAssignmentResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SectionDetailResponse {
    private SectionSummary section;
    private List<SubjectSummary> subjects;
    private List<TeacherAssignmentResponse> teacherAssignments;
    private List<TimetableEntryResponse> timetableEntries;
}
