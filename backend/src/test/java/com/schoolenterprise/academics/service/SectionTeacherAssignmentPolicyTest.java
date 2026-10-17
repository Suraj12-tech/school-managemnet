package com.schoolenterprise.academics.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.TimetableEntryRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SectionTeacherAssignmentPolicyTest {
    @Mock private DepartmentRepository departmentRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SubjectClassMappingRepository subjectClassMappingRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private TimetableEntryRepository timetableEntryRepository;
    @Mock private SchoolService schoolService;
    @Mock private AuditService auditService;
    @Mock private PermissionService permissionService;
    @Mock private StaffRepository staffRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ClassHistoryRepository classHistoryRepository;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @InjectMocks private AcademicsService academicsService;

    @Test
    void sectionCreationCannotSetClassTeacherDirectly() {
        when(schoolService.getSchool()).thenReturn(school());
        when(classRepository.findById(3L)).thenReturn(Optional.of(schoolClass(3L)));

        Section request = section(null, 3L, 5L, 7L);

        assertThrows(AppException.class, () -> academicsService.saveSection(request));
        verify(sectionRepository, never()).save(any(Section.class));
        verify(auditService, never()).record(any(), any(), any(), any(), any());
    }

    @Test
    void sectionUpdateCannotRemoveOrReplaceClassTeacherDirectly() {
        Section existing = section(4L, 3L, 5L, 7L);
        when(sectionRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(classRepository.findById(3L)).thenReturn(Optional.of(schoolClass(3L)));
        when(schoolService.getSchool()).thenReturn(school());

        Section replacement = section(4L, 3L, 5L, 8L);

        assertThrows(AppException.class, () -> academicsService.saveSection(replacement));
        verify(sectionRepository, never()).save(any(Section.class));
        verify(auditService, never()).record(any(), any(), any(), any(), any());
    }

    @Test
    void sectionCannotMoveWhileClassTeacherRemainsAssigned() {
        Section existing = section(4L, 3L, 5L, 7L);
        when(sectionRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(classRepository.findById(3L)).thenReturn(Optional.of(schoolClass(3L)));
        when(classRepository.findById(6L)).thenReturn(Optional.of(schoolClass(6L)));
        when(schoolService.getSchool()).thenReturn(school());

        Section moved = section(4L, 6L, 5L, 7L);

        assertThrows(AppException.class, () -> academicsService.saveSection(moved));
        verify(sectionRepository, never()).save(any(Section.class));
        verify(auditService, never()).record(any(), any(), any(), any(), any());
    }

    private School school() {
        School school = new School();
        school.setId(1L);
        return school;
    }

    private SchoolClass schoolClass(Long id) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(id);
        schoolClass.setSchoolId(1L);
        schoolClass.setNumberOfClassrooms(3);
        return schoolClass;
    }

    private Section section(Long id, Long classId, Long yearId, Long teacherId) {
        Section section = new Section();
        section.setId(id);
        section.setClassId(classId);
        section.setAcademicYearId(yearId);
        section.setName("A");
        section.setClassTeacherStaffId(teacherId);
        section.setStatus("ACTIVE");
        return section;
    }
}
