package com.schoolenterprise.staff.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.staff.dto.TeacherAssignmentRequest;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffAssignmentEligibilityTest {
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
    void activeTeachingStaffCanReceiveAssignment() {
        Staff staff = staff(10L, "TEACHING");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(subjectRepository.findById(20L)).thenReturn(Optional.of(subject()));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(20L, 30L, 40L))
                .thenReturn(true);
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass()));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(academicYear()));
        when(permissionService.isAdmin()).thenReturn(true);
        when(assignmentRepository.findAll()).thenReturn(List.of());
        when(assignmentRepository.save(any(TeacherAssignment.class))).thenAnswer(invocation -> {
            TeacherAssignment saved = invocation.getArgument(0);
            saved.setId(50L);
            return saved;
        });

        var result = service().createAssignment(request());

        assertEquals("ACTIVE", result.getStatus());
        verify(assignmentRepository).save(any(TeacherAssignment.class));
    }

    @Test
    void subjectTeacherAssignmentRequiresSubjectClassYearMapping() {
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff(10L, "TEACHING")));
        when(subjectRepository.findById(20L)).thenReturn(Optional.of(subject()));
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass()));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(academicYear()));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(20L, 30L, 40L))
                .thenReturn(false);

        assertThrows(AppException.class, () -> service().createAssignment(request()));

        verify(assignmentRepository, never()).save(any(TeacherAssignment.class));
        verify(sectionRepository, never()).save(any());
    }

    @Test
    void activeTeachingStaffCanReceiveClassAssignment() {
        Staff staff = staff(10L, "TEACHING");
        var section = new com.schoolenterprise.academics.entity.Section();
        section.setId(50L);
        section.setClassId(30L);
        section.setAcademicYearId(40L);
        section.setStatus("ACTIVE");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass()));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(academicYear()));
        when(sectionRepository.findById(50L)).thenReturn(Optional.of(section));
        when(permissionService.isAdmin()).thenReturn(true);
        when(assignmentRepository.findAll()).thenReturn(List.of());
        when(assignmentRepository.save(any(TeacherAssignment.class))).thenAnswer(invocation -> {
            TeacherAssignment saved = invocation.getArgument(0);
            saved.setId(51L);
            return saved;
        });

        var request = request();
        request.setSubjectId(null);
        request.setSectionId(50L);
        request.setAssignmentType("CLASS_TEACHER");

        var result = service().createAssignment(request);

        assertEquals("CLASS_TEACHER", result.getAssignmentType());
        assertEquals(10L, section.getClassTeacherStaffId());
        verify(sectionRepository).save(section);
    }

    @Test
    void inactiveClassAssignmentPutClearsSectionLink() {
        Staff staff = staff(10L, "TEACHING");
        var section = sectionWithTeacher(10L);
        TeacherAssignment assignment = classAssignment("ACTIVE");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass()));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(academicYear()));
        when(sectionRepository.findById(50L)).thenReturn(Optional.of(section));
        when(permissionService.isAdmin()).thenReturn(true);
        when(assignmentRepository.findById(55L)).thenReturn(Optional.of(assignment));
        when(sectionRepository.save(section)).thenReturn(section);
        when(assignmentRepository.save(assignment)).thenReturn(assignment);

        TeacherAssignmentRequest request = request();
        request.setSubjectId(null);
        request.setSectionId(50L);
        request.setAssignmentType("CLASS_TEACHER");
        request.setStatus("INACTIVE");

        service().updateAssignment(55L, request);

        assertNull(section.getClassTeacherStaffId());
        assertEquals("INACTIVE", assignment.getStatus());
        verify(sectionRepository).save(section);
        verify(assignmentRepository).save(assignment);
    }

    @Test
    void classAssignmentReactivationRestoresValidatedSectionLink() {
        Staff staff = staff(10L, "TEACHING");
        var section = sectionWithTeacher(null);
        TeacherAssignment assignment = classAssignment("INACTIVE");
        when(assignmentRepository.findById(55L)).thenReturn(Optional.of(assignment));
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(sectionRepository.findById(50L)).thenReturn(Optional.of(section));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(academicYear()));
        when(assignmentRepository.findAll()).thenReturn(List.of(assignment));
        when(sectionRepository.save(section)).thenReturn(section);
        when(assignmentRepository.save(assignment)).thenReturn(assignment);
        when(classRepository.findById(30L)).thenReturn(Optional.of(schoolClass()));

        service().updateAssignmentStatus(55L, "ACTIVE");

        assertEquals(10L, section.getClassTeacherStaffId());
        assertEquals("ACTIVE", assignment.getStatus());
        verify(sectionRepository).save(section);
        verify(assignmentRepository).save(assignment);
    }

    @Test
    void nonTeachingStaffCannotReceiveAssignment() {
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff(10L, "NON_TEACHING")));

        assertThrows(AppException.class, () -> service().createAssignment(request()));
    }

    @Test
    void unclassifiedStaffCannotReceiveAssignment() {
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff(10L, null)));

        assertThrows(AppException.class, () -> service().createAssignment(request()));
    }

    @Test
    void nonTeachingStaffCannotReactivateAnAssignment() {
        var assignment = new TeacherAssignment();
        assignment.setId(50L);
        assignment.setStaffId(10L);
        assignment.setStatus("INACTIVE");
        when(assignmentRepository.findById(50L)).thenReturn(Optional.of(assignment));
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff(10L, "NON_TEACHING")));

        assertThrows(AppException.class, () -> service().updateAssignmentStatus(50L, "ACTIVE"));
        assertEquals("INACTIVE", assignment.getStatus());
        verify(assignmentRepository, never()).save(any(TeacherAssignment.class));
    }

    @Test
    void reactivationRejectsInactiveAndUnclassifiedStaffWithoutSaving() {
        for (String staffStatus : List.of("INACTIVE", "ACTIVE")) {
            String category = "INACTIVE".equals(staffStatus) ? "TEACHING" : null;
            Staff ineligibleStaff = staff(10L, category);
            ineligibleStaff.setStatus(staffStatus);
            var assignment = inactiveAssignment();
            when(assignmentRepository.findById(50L)).thenReturn(Optional.of(assignment));
            when(staffRepository.findById(10L)).thenReturn(Optional.of(ineligibleStaff));

            assertThrows(AppException.class, () -> service().updateAssignmentStatus(50L, "ACTIVE"));
            assertEquals("INACTIVE", assignment.getStatus());
            verify(assignmentRepository, never()).save(any(TeacherAssignment.class));
            verify(staffRepository, never()).save(any(Staff.class));
            org.mockito.Mockito.reset(assignmentRepository, staffRepository);
        }
    }

    @Test
    void staffStatusCannotBecomeInactiveWhileActiveAssignmentsExist() {
        Staff staff = staff(10L, "TEACHING");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(assignmentRepository.existsByStaffIdAndStatus(10L, "ACTIVE")).thenReturn(true);

        assertThrows(AppException.class, () -> service().updateStatus(10L, "INACTIVE"));

        assertEquals("ACTIVE", staff.getStatus());
        assertEquals("TEACHING", staff.getStaffCategory());
        verify(staffRepository, never()).save(any(Staff.class));
    }

    @Test
    void staffCategoryCannotChangeToNonTeachingWhileActiveAssignmentsExist() {
        assertCategoryChangeBlocked("NON_TEACHING");
    }

    @Test
    void staffCategoryCannotBeClearedWhileActiveAssignmentsExist() {
        assertCategoryChangeBlocked("");
    }

    @Test
    void eligibilityChangesAreAllowedAfterAssignmentsAreDeactivated() {
        Staff teachingStaff = staff(10L, "TEACHING");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(teachingStaff));
        when(assignmentRepository.existsByStaffIdAndStatus(10L, "ACTIVE")).thenReturn(false);
        when(staffRepository.save(teachingStaff)).thenReturn(teachingStaff);

        var statusResponse = service().updateStatus(10L, "INACTIVE");
        assertEquals("INACTIVE", statusResponse.getStatus());
        assertEquals("INACTIVE", teachingStaff.getStatus());

        Staff activeTeachingStaff = staff(10L, "TEACHING");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(activeTeachingStaff));
        when(staffRepository.existsByEmployeeIdAndIdNot("EMP-10", 10L)).thenReturn(false);
        when(departmentRepository.existsById(2L)).thenReturn(true);
        when(staffRepository.save(activeTeachingStaff)).thenReturn(activeTeachingStaff);

        var response = service().update(10L, staffRequest("NON_TEACHING"));

        assertEquals("NON_TEACHING", response.getStaffCategory());
        assertEquals("NON_TEACHING", activeTeachingStaff.getStaffCategory());
        verify(staffRepository).save(activeTeachingStaff);
    }

    @Test
    void assignmentPutRejectsIneligibleStaffForActiveAndInactiveRequestsWithoutSaving() {
        List<Staff> ineligibleStaff = List.of(
                staffWithStatus("INACTIVE", "TEACHING"),
                staff("NON_TEACHING"),
                staff(null)
        );
        for (Staff staff : ineligibleStaff) {
            for (String assignmentStatus : List.of("ACTIVE", "INACTIVE")) {
                when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));

                assertThrows(AppException.class, () -> service().updateAssignment(50L,
                        assignmentRequest(assignmentStatus)));

                verify(assignmentRepository, never()).save(any(TeacherAssignment.class));
                verify(staffRepository, never()).save(any(Staff.class));
                org.mockito.Mockito.reset(staffRepository, assignmentRepository);
            }
        }
    }

    @Test
    void existingUnclassifiedStaffRemainUnclassifiedWhenCategoryIsOmitted() {
        Staff unclassified = staff(10L, null);
        when(staffRepository.findById(10L)).thenReturn(Optional.of(unclassified));
        when(staffRepository.existsByEmployeeIdAndIdNot("EMP-10", 10L)).thenReturn(false);
        when(departmentRepository.existsById(2L)).thenReturn(true);
        when(staffRepository.save(unclassified)).thenReturn(unclassified);

        var request = new com.schoolenterprise.staff.dto.StaffRequest();
        request.setEmployeeId("EMP-10");
        request.setFullName("Example Staff");
        request.setDesignation("Staff member");
        request.setDepartmentId(2L);
        request.setEmail("staff@example.test");

        var response = service().update(10L, request);

        assertNull(unclassified.getStaffCategory());
        assertNull(response.getStaffCategory());
    }

    private StaffService service() {
        return new StaffService(staffRepository, assignmentRepository, auditService, permissionService,
                departmentRepository, subjectRepository, classRepository, sectionRepository,
                subjectClassMappingRepository, academicYearRepository, schoolService);
    }

    private TeacherAssignmentRequest request() {
        TeacherAssignmentRequest request = new TeacherAssignmentRequest();
        request.setStaffId(10L);
        request.setSubjectId(20L);
        request.setClassId(30L);
        request.setAcademicYearId(40L);
        request.setAssignmentType("SUBJECT_TEACHER");
        request.setStatus("ACTIVE");
        return request;
    }

    private Staff staff(Long id, String category) {
        Staff staff = new Staff();
        staff.setId(id);
        staff.setStatus("ACTIVE");
        staff.setStaffCategory(category);
        return staff;
    }

    private Staff staff(String category) {
        return staff(10L, category);
    }

    private Staff staffWithStatus(String status, String category) {
        Staff staff = staff(10L, category);
        staff.setStatus(status);
        return staff;
    }

    private void assertCategoryChangeBlocked(String requestedCategory) {
        Staff staff = staff(10L, "TEACHING");
        when(staffRepository.findById(10L)).thenReturn(Optional.of(staff));
        when(staffRepository.existsByEmployeeIdAndIdNot("EMP-10", 10L)).thenReturn(false);
        when(assignmentRepository.existsByStaffIdAndStatus(10L, "ACTIVE")).thenReturn(true);

        assertThrows(AppException.class,
                () -> service().update(10L, staffRequest(requestedCategory)));

        assertEquals("TEACHING", staff.getStaffCategory());
        assertEquals("ACTIVE", staff.getStatus());
        verify(staffRepository, never()).save(any(Staff.class));
    }

    private com.schoolenterprise.staff.dto.StaffRequest staffRequest(String category) {
        var request = new com.schoolenterprise.staff.dto.StaffRequest();
        request.setEmployeeId("EMP-10");
        request.setFullName("Example Staff");
        request.setDesignation("Staff member");
        request.setDepartmentId(2L);
        request.setEmail("staff@example.test");
        request.setStaffCategory(category);
        return request;
    }

    private TeacherAssignmentRequest assignmentRequest(String status) {
        TeacherAssignmentRequest request = request();
        request.setStatus(status);
        return request;
    }

    private TeacherAssignment inactiveAssignment() {
        var assignment = new TeacherAssignment();
        assignment.setId(50L);
        assignment.setStaffId(10L);
        assignment.setStatus("INACTIVE");
        return assignment;
    }

    private TeacherAssignment classAssignment(String status) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(55L);
        assignment.setStaffId(10L);
        assignment.setClassId(30L);
        assignment.setSectionId(50L);
        assignment.setAcademicYearId(40L);
        assignment.setAssignmentType("CLASS_TEACHER");
        assignment.setStatus(status);
        return assignment;
    }

    private com.schoolenterprise.academics.entity.Section sectionWithTeacher(Long staffId) {
        var section = new com.schoolenterprise.academics.entity.Section();
        section.setId(50L);
        section.setClassId(30L);
        section.setAcademicYearId(40L);
        section.setStatus("ACTIVE");
        section.setClassTeacherStaffId(staffId);
        return section;
    }

    private Subject subject() {
        Subject subject = new Subject();
        subject.setId(20L);
        subject.setStatus("ACTIVE");
        return subject;
    }

    private SchoolClass schoolClass() {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(30L);
        return schoolClass;
    }

    private AcademicYear academicYear() {
        AcademicYear year = new AcademicYear();
        year.setId(40L);
        year.setStatus("ACTIVE");
        return year;
    }
}
