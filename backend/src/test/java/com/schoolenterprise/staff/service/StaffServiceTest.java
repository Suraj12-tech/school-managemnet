package com.schoolenterprise.staff.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffServiceTest {
    @Mock private StaffRepository staffRepository;
    @Mock private TeacherAssignmentRepository assignmentRepository;
    @Mock private AuditService auditService;
    @Mock private PermissionService permissionService;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectClassMappingRepository subjectClassMappingRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private SchoolService schoolService;

    @Test
    void teacherAssignmentsAreFilteredByYearAndIncludeTypeAndStatus() {
        Staff staff = new Staff();
        staff.setId(10L);
        TeacherAssignment current = assignment(10L, 20L);
        TeacherAssignment historical = assignment(10L, 21L);
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(30L);
        schoolClass.setName("Class 6");
        Section section = new Section();
        section.setId(40L);
        section.setName("A");
        AcademicYear year = new AcademicYear();
        year.setId(20L);
        year.setName("2026-2027");

        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(permissionService.hasSchoolWideAccess()).thenReturn(true);
        when(assignmentRepository.findByStaffId(10L)).thenReturn(List.of(current, historical));
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass));
        when(sectionRepository.findById(40L)).thenReturn(Optional.of(section));
        when(academicYearRepository.findById(20L)).thenReturn(Optional.of(year));

        var result = new StaffService(staffRepository, assignmentRepository, auditService, permissionService,
                departmentRepository, subjectRepository, classRepository, sectionRepository,
                subjectClassMappingRepository, academicYearRepository, schoolService).assignments(10L, 20L);

        assertEquals(1, result.size());
        assertEquals("CLASS_TEACHER", result.get(0).getAssignmentType());
        assertEquals("ACTIVE", result.get(0).getStatus());
        assertEquals("2026-2027", result.get(0).getAcademicYearName());
        verify(permissionService).assertYearAccess(20L);
    }

    private TeacherAssignment assignment(Long staffId, Long yearId) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(yearId);
        assignment.setStaffId(staffId);
        assignment.setClassId(30L);
        assignment.setSectionId(40L);
        assignment.setAcademicYearId(yearId);
        assignment.setAssignmentType("CLASS_TEACHER");
        assignment.setStatus("ACTIVE");
        return assignment;
    }
}
