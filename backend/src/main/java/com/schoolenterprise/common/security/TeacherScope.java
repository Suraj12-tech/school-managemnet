package com.schoolenterprise.common.security;

import java.util.Set;

public record TeacherScope(
        Long staffId,
        Set<Long> assignmentIds,
        Set<Long> classIds,
        Set<Long> sectionIds,
        Set<Long> subjectIds,
        Set<Long> academicYearIds
) {
}
