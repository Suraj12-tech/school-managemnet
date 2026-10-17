package com.schoolenterprise.common.security;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherScopeResolverTest {
    @Mock private StaffRepository staffRepository;
    @Mock private TeacherAssignmentRepository assignmentRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SubjectClassMappingRepository subjectClassMappingRepository;
    @Mock private AcademicYearRepository academicYearRepository;

    @Test
    void resolvesOnlyActiveValidAssignmentsForActiveTeachingStaff() {
        Staff staff = staff(10L, "ACTIVE", "TEACHING");
        TeacherAssignment classAssignment = assignment("CLASS_TEACHER", "ACTIVE", 31L);
        TeacherAssignment subjectAssignment = assignment("SUBJECT_TEACHER", "ACTIVE", null);
        TeacherAssignment inactiveAssignment = assignment("SUBJECT_TEACHER", "INACTIVE", null);
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff));
        when(assignmentRepository.findByStaffId(10L))
                .thenReturn(List.of(classAssignment, subjectAssignment, inactiveAssignment));
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L, "ACTIVE")));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section(31L, 20L, 40L, 10L, "ACTIVE")));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(30L, 20L, 40L))
                .thenReturn(true);

        TeacherScope scope = resolver().resolve(user(true));

        assertEquals(Set.of(20L), scope.classIds());
        assertEquals(Set.of(31L), scope.sectionIds());
        assertEquals(Set.of(30L), scope.subjectIds());
        assertEquals(Set.of(40L), scope.academicYearIds());
    }

    @Test
    void requiresActiveLinkedTeachingStaff() {
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff(10L, "INACTIVE", "TEACHING")));
        assertThrows(AppException.class, () -> resolver().resolve(user(true)));

        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff(10L, "ACTIVE", "NON_TEACHING")));
        assertThrows(AppException.class, () -> resolver().resolve(user(true)));
    }

    @Test
    void requiresLinkedStaffAndActiveAccount() {
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of());
        assertThrows(AppException.class, () -> resolver().resolve(user(true)));
        assertThrows(AppException.class, () -> resolver().resolve(user(false)));
    }

    @Test
    void rejectsAmbiguousMultipleStaffLinks() {
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(
                staff(10L, "ACTIVE", "TEACHING"),
                staff(11L, "ACTIVE", "TEACHING")));

        assertThrows(AppException.class, () -> resolver().resolve(user(true)));
    }

    @Test
    void excludesMismatchedClassSectionAndYearRelationships() {
        Staff staff = staff(10L, "ACTIVE", "TEACHING");
        TeacherAssignment invalid = assignment("CLASS_TEACHER", "ACTIVE", 31L);
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff));
        when(assignmentRepository.findByStaffId(10L)).thenReturn(List.of(invalid));
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L, "ACTIVE")));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section(31L, 21L, 40L, 10L, "ACTIVE")));

        TeacherScope scope = resolver().resolve(user(true));

        assertEquals(Set.of(), scope.classIds());
        assertEquals(Set.of(), scope.sectionIds());
        assertEquals(Set.of(), scope.academicYearIds());
    }

    @Test
    void excludesClassTeacherAssignmentWhenSectionLinkDoesNotMatch() {
        Staff staff = staff(10L, "ACTIVE", "TEACHING");
        TeacherAssignment invalid = assignment("CLASS_TEACHER", "ACTIVE", 31L);
        when(staffRepository.findAllByUserId(2L)).thenReturn(List.of(staff));
        when(assignmentRepository.findByStaffId(10L)).thenReturn(List.of(invalid));
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L, "ACTIVE")));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section(31L, 20L, 40L, 11L, "ACTIVE")));

        TeacherScope scope = resolver().resolve(user(true));

        assertEquals(Set.of(), scope.classIds());
        assertEquals(Set.of(), scope.sectionIds());
    }

    private TeacherScopeResolver resolver() {
        return new TeacherScopeResolver(staffRepository, assignmentRepository, classRepository,
                sectionRepository, subjectRepository, subjectClassMappingRepository, academicYearRepository);
    }

    private AppUserDetails user(boolean active) {
        return new AppUserDetails(2L, "teacher", "x", active, Set.of("CLASS_TEACHER"),
                Set.of(), List.of());
    }

    private Staff staff(Long id, String status, String category) {
        Staff staff = new Staff();
        staff.setId(id);
        staff.setStatus(status);
        staff.setStaffCategory(category);
        return staff;
    }

    private TeacherAssignment assignment(String type, String status, Long sectionId) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId("CLASS_TEACHER".equals(type) ? 100L : sectionId == null ? 101L : 102L);
        assignment.setStaffId(10L);
        assignment.setClassId(20L);
        assignment.setSubjectId("SUBJECT_TEACHER".equals(type) ? 30L : null);
        assignment.setSectionId(sectionId);
        assignment.setAcademicYearId(40L);
        assignment.setAssignmentType(type);
        assignment.setStatus(status);
        return assignment;
    }

    private SchoolClass schoolClass(Long id, Long schoolId) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(id);
        schoolClass.setSchoolId(schoolId);
        return schoolClass;
    }

    private Section section(Long id, Long classId, Long yearId, Long teacherStaffId, String status) {
        Section section = new Section();
        section.setId(id);
        section.setClassId(classId);
        section.setAcademicYearId(yearId);
        section.setClassTeacherStaffId(teacherStaffId);
        section.setStatus(status);
        return section;
    }

    private Subject subject(Long id, Long schoolId, String status) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setSchoolId(schoolId);
        subject.setStatus(status);
        return subject;
    }

    private AcademicYear year(Long id, Long schoolId, String status) {
        AcademicYear year = new AcademicYear();
        year.setId(id);
        year.setSchoolId(schoolId);
        year.setStatus(status);
        return year;
    }
}
