package com.schoolenterprise.academics.controller;

import com.schoolenterprise.academics.dto.TimetableEntryRequest;
import com.schoolenterprise.academics.dto.TimetableWorkingDaysRequest;
import com.schoolenterprise.common.security.ExcludeTeacherRoles;
import com.schoolenterprise.common.security.RequirePermission;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TimetableControllerAuthorizationTest {

    @Test
    void timetableEndpointsKeepExistingTeacherExclusionAndPermissions() throws Exception {
        assertTrue(AcademicsController.class.isAnnotationPresent(ExcludeTeacherRoles.class));

        assertPermission("timetableWorkingDays", new Class<?>[]{}, "view");
        assertPermission("replaceTimetableWorkingDays",
                new Class<?>[]{TimetableWorkingDaysRequest.class}, "edit");
        assertPermission("timetableEntries", new Class<?>[]{
                Long.class, Long.class, Long.class, Long.class
        }, "view");
        assertPermission("timetableEntry", new Class<?>[]{Long.class}, "view");
        assertPermission("createTimetableEntry", new Class<?>[]{TimetableEntryRequest.class}, "create");
        assertPermission("updateTimetableEntry",
                new Class<?>[]{Long.class, TimetableEntryRequest.class}, "edit");
        assertPermission("deleteTimetableEntry", new Class<?>[]{Long.class}, "delete");
    }

    private void assertPermission(String methodName, Class<?>[] parameterTypes, String action)
            throws NoSuchMethodException {
        Method method = AcademicsController.class.getDeclaredMethod(methodName, parameterTypes);
        RequirePermission permission = method.getAnnotation(RequirePermission.class);

        assertNotNull(permission);
        assertEquals("classes", permission.module());
        assertEquals(action, permission.action());
    }
}
