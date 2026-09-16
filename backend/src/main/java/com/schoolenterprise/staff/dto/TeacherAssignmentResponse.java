package com.schoolenterprise.staff.dto;

import com.schoolenterprise.staff.entity.TeacherAssignment;
import lombok.Getter;

@Getter
public class TeacherAssignmentResponse {
    private final Long id;
    private final Long staffId;
    private final String teacherName;
    private final Long subjectId;
    private final String subjectName;
    private final Long classId;
    private final String className;
    private final Long sectionId;
    private final String sectionName;
    private final Long academicYearId;
    private final String academicYearName;
    private final String assignmentType;
    private final String status;

    public TeacherAssignmentResponse(TeacherAssignment assignment, String teacherName, String subjectName,
                                     String className, String sectionName, String academicYearName) {
        id = assignment.getId();
        staffId = assignment.getStaffId();
        this.teacherName = teacherName;
        subjectId = assignment.getSubjectId();
        this.subjectName = subjectName;
        classId = assignment.getClassId();
        this.className = className;
        sectionId = assignment.getSectionId();
        this.sectionName = sectionName;
        academicYearId = assignment.getAcademicYearId();
        this.academicYearName = academicYearName;
        assignmentType = assignment.getAssignmentType();
        status = assignment.getStatus();
    }
}
