package com.schoolenterprise.staff.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class StaffProfileResponse extends StaffResponse {
    private final List<AssignmentResponse> assignments;

    public StaffProfileResponse(StaffResponse staff, List<AssignmentResponse> assignments) {
        super(staff);
        this.assignments = assignments;
    }

    @Getter
    public static class AssignmentResponse {
        private final Long id;
        private final Long subjectId;
        private final String subjectName;
        private final Long classId;
        private final String className;
        private final Long sectionId;
        private final String sectionName;
        private final Long academicYearId;
        private final String academicYearName;

        public AssignmentResponse(Long id, Long subjectId, String subjectName, Long classId, String className,
                                  Long sectionId, String sectionName, Long academicYearId, String academicYearName) {
            this.id = id;
            this.subjectId = subjectId;
            this.subjectName = subjectName;
            this.classId = classId;
            this.className = className;
            this.sectionId = sectionId;
            this.sectionName = sectionName;
            this.academicYearId = academicYearId;
            this.academicYearName = academicYearName;
        }
    }
}
