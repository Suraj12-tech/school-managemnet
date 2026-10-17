package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.student.entity.Enrollment;
import com.schoolenterprise.student.entity.Guardian;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.entity.StudentGuardian;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.GuardianRepository;
import com.schoolenterprise.student.repository.StudentDocumentRepository;
import com.schoolenterprise.student.repository.StudentGuardianRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuardianProfileServiceTest {
    @Mock private StudentRepository studentRepository;
    @Mock private GuardianRepository guardianRepository;
    @Mock private StudentGuardianRepository studentGuardianRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ClassHistoryRepository classHistoryRepository;
    @Mock private StudentDocumentRepository documentRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private PermissionService permissionService;
    @Mock private AuditService auditService;

    @Test
    void guardianDetailsIncludesEveryLinkedStudent() {
        Guardian guardian = guardian();
        Student first = student(1L, "Aarav", "ACTIVE", null);
        Student second = student(2L, "Rohan", "INACTIVE", null);
        when(guardianRepository.findById(10L)).thenReturn(Optional.of(guardian));
        when(permissionService.hasSchoolWideAccess()).thenReturn(true);
        when(studentGuardianRepository.findByGuardianId(10L)).thenReturn(List.of(link(1L), link(2L)));
        when(studentRepository.findById(1L)).thenReturn(Optional.of(first));
        when(studentRepository.findById(2L)).thenReturn(Optional.of(second));

        var details = service().guardianDetails(10L, null);

        assertEquals(2, details.students().size());
        assertEquals(List.of(1L, 2L), details.students().stream().map(item -> item.studentId()).toList());
        assertEquals("ACTIVE", details.students().get(0).studentStatus());
        assertEquals("INACTIVE", details.students().get(1).studentStatus());
    }

    @Test
    void guardianDetailsUsesOnlyTheSelectedYearEnrollment() {
        Guardian guardian = guardian();
        Student student = student(1L, "Aarav", "ACTIVE", 99L);
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(1L);
        enrollment.setAcademicYearId(2026L);
        enrollment.setSectionId(26L);
        enrollment.setStatus("ENROLLED");
        Enrollment historicalEnrollment = new Enrollment();
        historicalEnrollment.setStudentId(1L);
        historicalEnrollment.setAcademicYearId(2025L);
        historicalEnrollment.setSectionId(25L);
        historicalEnrollment.setStatus("ENROLLED");
        Section section = new Section();
        section.setId(26L);
        section.setClassId(6L);
        section.setAcademicYearId(2026L);
        section.setName("A");
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(6L);
        schoolClass.setName("Class 6");
        when(guardianRepository.findById(10L)).thenReturn(Optional.of(guardian));
        when(permissionService.hasSchoolWideAccess()).thenReturn(true);
        when(studentGuardianRepository.findByGuardianId(10L)).thenReturn(List.of(link(1L)));
        when(academicYearRepository.findById(2026L)).thenReturn(Optional.of(new AcademicYear()));
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentId(1L)).thenReturn(List.of(historicalEnrollment, enrollment));
        when(sectionRepository.findById(26L)).thenReturn(Optional.of(section));
        when(schoolClassRepository.findById(6L)).thenReturn(Optional.of(schoolClass));

        var details = service().guardianDetails(10L, 2026L);

        assertEquals("Class 6", details.students().get(0).className());
        assertEquals("A", details.students().get(0).sectionName());
        assertEquals("ENROLLED", details.students().get(0).enrollmentStatus());
    }

    private StudentService service() {
        return new StudentService(studentRepository, guardianRepository, studentGuardianRepository,
                enrollmentRepository, classHistoryRepository, documentRepository, sectionRepository,
                schoolClassRepository, academicYearRepository, permissionService, auditService);
    }

    private Guardian guardian() {
        Guardian guardian = new Guardian();
        guardian.setId(10L);
        guardian.setFullName("Guardian");
        return guardian;
    }

    private Student student(Long id, String firstName, String status, Long currentSectionId) {
        Student student = new Student();
        student.setId(id);
        student.setFirstName(firstName);
        student.setLastName("Student");
        student.setAdmissionNumber("ADM" + id);
        student.setStatus(status);
        student.setCurrentSectionId(currentSectionId);
        return student;
    }

    private StudentGuardian link(Long studentId) {
        StudentGuardian link = new StudentGuardian();
        link.setStudentId(studentId);
        link.setGuardianId(10L);
        link.setRelationshipType("PARENT");
        return link;
    }
}
