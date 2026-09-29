package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.student.dto.PromotionRequest;
import com.schoolenterprise.student.dto.PromotionDecision;
import com.schoolenterprise.student.entity.ClassHistory;
import com.schoolenterprise.student.entity.Enrollment;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {
    private static final Long FROM_YEAR_ID = 1L;
    private static final Long TO_YEAR_ID = 2L;
    private static final Long SOURCE_CLASS_ID = 6L;
    private static final Long TARGET_CLASS_ID = 7L;
    private static final Long TARGET_SECTION_ID = 71L;
    private static final Long SOURCE_SECTION_ID = 61L;
    private static final Long SOURCE_SECTION_B_ID = 62L;
    private static final Long TARGET_SECTION_B_ID = 72L;
    private static final Long STUDENT_ID = 100L;
    private static final Long SECOND_STUDENT_ID = 101L;

    @Mock private StudentRepository studentRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ClassHistoryRepository classHistoryRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private PermissionService permissionService;
    @Mock private AuditService auditService;

    private PromotionService promotionService;
    private PromotionRequest request;
    private SchoolClass class6;
    private SchoolClass class7;
    private Section targetSectionA;
    private Section targetSectionB;
    private Section sourceSection;
    private Section sourceSectionB;
    private Enrollment sourceEnrollment;
    private Enrollment secondSourceEnrollment;
    private Student student;
    private Student secondStudent;

    @BeforeEach
    void setUp() {
        promotionService = new PromotionService(studentRepository, enrollmentRepository, classHistoryRepository,
                academicYearRepository, schoolClassRepository, sectionRepository, permissionService, auditService);

        AcademicYear fromYear = new AcademicYear();
        fromYear.setId(FROM_YEAR_ID);
        fromYear.setName("2026-2027");
        fromYear.setSchoolId(1L);
        AcademicYear toYear = new AcademicYear();
        toYear.setId(TO_YEAR_ID);
        toYear.setName("2027-2028");
        toYear.setSchoolId(1L);

        class6 = schoolClass(SOURCE_CLASS_ID, "Class 6");
        class7 = schoolClass(TARGET_CLASS_ID, "Class 7");
        targetSectionA = section(TARGET_SECTION_ID, TARGET_CLASS_ID, TO_YEAR_ID, "A");
        targetSectionB = section(TARGET_SECTION_B_ID, TARGET_CLASS_ID, TO_YEAR_ID, "B");
        sourceSection = section(SOURCE_SECTION_ID, SOURCE_CLASS_ID, FROM_YEAR_ID, "A");
        sourceSectionB = section(SOURCE_SECTION_B_ID, SOURCE_CLASS_ID, FROM_YEAR_ID, "B");

        sourceEnrollment = new Enrollment();
        sourceEnrollment.setId(900L);
        sourceEnrollment.setStudentId(STUDENT_ID);
        sourceEnrollment.setSectionId(SOURCE_SECTION_ID);
        sourceEnrollment.setAcademicYearId(FROM_YEAR_ID);
        sourceEnrollment.setStatus("ENROLLED");

        secondSourceEnrollment = new Enrollment();
        secondSourceEnrollment.setId(901L);
        secondSourceEnrollment.setStudentId(SECOND_STUDENT_ID);
        secondSourceEnrollment.setSectionId(SOURCE_SECTION_B_ID);
        secondSourceEnrollment.setAcademicYearId(FROM_YEAR_ID);
        secondSourceEnrollment.setStatus("ENROLLED");

        student = new Student();
        student.setId(STUDENT_ID);
        student.setFirstName("Suraj");
        student.setLastName("Sharma");
        student.setAdmissionNumber("ADM100");
        student.setStatus("ACTIVE");
        student.setCurrentSectionId(SOURCE_SECTION_ID);

        secondStudent = new Student();
        secondStudent.setId(SECOND_STUDENT_ID);
        secondStudent.setFirstName("Rahul");
        secondStudent.setLastName("Kumar");
        secondStudent.setAdmissionNumber("ADM101");
        secondStudent.setStatus("ACTIVE");
        secondStudent.setCurrentSectionId(SOURCE_SECTION_B_ID);

        request = new PromotionRequest();
        request.setFromAcademicYearId(FROM_YEAR_ID);
        request.setToAcademicYearId(TO_YEAR_ID);
        request.setSourceClassId(SOURCE_CLASS_ID);

        lenient().when(academicYearRepository.findById(FROM_YEAR_ID)).thenReturn(Optional.of(fromYear));
        lenient().when(academicYearRepository.findById(TO_YEAR_ID)).thenReturn(Optional.of(toYear));
        lenient().when(permissionService.hasSchoolWideAccess()).thenReturn(true);
        lenient().when(schoolClassRepository.findById(SOURCE_CLASS_ID)).thenReturn(Optional.of(class6));
        lenient().when(schoolClassRepository.findBySchoolId(1L)).thenReturn(List.of(class6, class7,
                schoolClass(1L, "Class 1"), schoolClass(10L, "Class 10"), schoolClass(12L, "Class 12")));
        lenient().when(sectionRepository.findByClassId(SOURCE_CLASS_ID))
                .thenReturn(List.of(sourceSection, sourceSectionB));
        lenient().when(sectionRepository.findByClassId(TARGET_CLASS_ID))
                .thenReturn(List.of(targetSectionA));
        lenient().when(enrollmentRepository.findCurrentEnrollmentsForPromotion(eq(FROM_YEAR_ID), eq(SOURCE_CLASS_ID)))
                .thenReturn(List.of(sourceEnrollment));
        lenient().when(enrollmentRepository.existsByStudentIdAndAcademicYearId(STUDENT_ID, TO_YEAR_ID)).thenReturn(false);
        lenient().when(studentRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        lenient().when(studentRepository.findById(SECOND_STUDENT_ID)).thenReturn(Optional.of(secondStudent));
        lenient().when(sectionRepository.findById(SOURCE_SECTION_ID)).thenReturn(Optional.of(sourceSection));
        lenient().when(sectionRepository.findById(SOURCE_SECTION_B_ID)).thenReturn(Optional.of(sourceSectionB));
        lenient().when(schoolClassRepository.findById(SOURCE_CLASS_ID)).thenReturn(Optional.of(class6));
    }

    @Test
    void previewQueriesOnlyTheImmediatelyPreviousClassAndReturnsThoseStudents() {
        var preview = promotionService.preview(request);

        assertEquals(1, preview.rows().size());
        assertEquals("Class 6", preview.rows().get(0).currentClass());
        assertEquals("Class 7", preview.rows().get(0).newClass());
        assertEquals("A", preview.rows().get(0).newSection());
        assertEquals("Class 6", preview.fromClass());
        assertEquals("Class 7", preview.toClass());
        verify(enrollmentRepository).findCurrentEnrollmentsForPromotion(FROM_YEAR_ID, SOURCE_CLASS_ID);
        verify(enrollmentRepository, never()).findByAcademicYearId(FROM_YEAR_ID);
    }

    @Test
    void previewShowsBlockedStudentsWhenMatchingTargetSectionIsMissing() {
        when(sectionRepository.findByClassId(TARGET_CLASS_ID)).thenReturn(List.of());

        var preview = promotionService.preview(request);

        assertEquals(1, preview.rows().size());
        assertEquals("NOT_PROMOTED", preview.rows().get(0).status());
        assertTrue(preview.rows().get(0).promotionBlocked());
        assertTrue(preview.rows().get(0).issue().contains("Section A is not available"));
    }

    @Test
    void previewMapsStudentsToTheSameNamedTargetSection() {
        when(sectionRepository.findByClassId(TARGET_CLASS_ID)).thenReturn(List.of(targetSectionA, targetSectionB));
        when(enrollmentRepository.findCurrentEnrollmentsForPromotion(FROM_YEAR_ID, SOURCE_CLASS_ID))
                .thenReturn(List.of(sourceEnrollment, secondSourceEnrollment));

        var preview = promotionService.preview(request);

        assertEquals(2, preview.rows().size());
        assertEquals("A", preview.rows().get(0).newSection());
        assertEquals("B", preview.rows().get(1).newSection());
        assertEquals("PROMOTED", preview.rows().get(0).status());
        assertEquals("PROMOTED", preview.rows().get(1).status());
    }

    @Test
    void missingSectionBlocksOnlyItsStudentsWhileAvailableSectionsCanPromote() {
        when(enrollmentRepository.findCurrentEnrollmentsForPromotion(FROM_YEAR_ID, SOURCE_CLASS_ID))
                .thenReturn(List.of(sourceEnrollment, secondSourceEnrollment));

        var preview = promotionService.preview(request);
        assertEquals("A", preview.rows().get(0).newSection());
        assertEquals("B", preview.rows().get(1).currentSection());
        assertNull(preview.rows().get(1).newSection());
        assertTrue(preview.rows().get(1).promotionBlocked());
        request.setDecisions(List.of(
                new PromotionDecision(STUDENT_ID, "PROMOTED"),
                new PromotionDecision(SECOND_STUDENT_ID, "PROMOTED")));

        var summary = promotionService.confirm(request);

        assertEquals(1, summary.promoted());
        assertEquals(1, summary.failed());
        ArgumentCaptor<Enrollment> enrollmentCaptor = ArgumentCaptor.forClass(Enrollment.class);
        verify(enrollmentRepository).save(enrollmentCaptor.capture());
        assertEquals(STUDENT_ID, enrollmentCaptor.getValue().getStudentId());
        assertEquals(TARGET_SECTION_ID, enrollmentCaptor.getValue().getSectionId());
    }

    @Test
    void sourceYearAndClassAreUsedByTheEnrollmentQuery() {
        promotionService.preview(request);

        verify(enrollmentRepository).findCurrentEnrollmentsForPromotion(FROM_YEAR_ID, SOURCE_CLASS_ID);
    }

    @Test
    void previewRejectsIdenticalAcademicYears() {
        request.setToAcademicYearId(FROM_YEAR_ID);

        AppException exception = assertThrows(AppException.class, () -> promotionService.preview(request));

        assertEquals("Source and target academic years must be different.", exception.getMessage());
    }

    @Test
    void scopedUserMustHaveAccessToBothYearsTargetClassAndSection() {
        when(permissionService.hasSchoolWideAccess()).thenReturn(false);

        promotionService.preview(request);

        verify(permissionService).assertYearAccess(FROM_YEAR_ID);
        verify(permissionService).assertYearAccess(TO_YEAR_ID);
        verify(permissionService).assertClass(SOURCE_CLASS_ID);
        verify(permissionService).assertClass(TARGET_CLASS_ID);
        verify(permissionService).assertStudentSection(TARGET_SECTION_ID);
        verify(permissionService).assertStudent(STUDENT_ID, SOURCE_SECTION_ID);
    }

    @Test
    void alreadyEnrolledStudentIsMarkedAndNotEnrolledAgain() {
        when(enrollmentRepository.existsByStudentIdAndAcademicYearId(STUDENT_ID, TO_YEAR_ID)).thenReturn(true);

        var preview = promotionService.preview(request);
        assertEquals("NOT_PROMOTED", preview.rows().get(0).status());
        assertTrue(preview.rows().get(0).issue().contains("already enrolled in the target academic year"));

        var summary = promotionService.confirm(request);

        assertEquals(0, summary.promoted());
        assertEquals(1, summary.failed());
        verify(enrollmentRepository, never()).save(any(Enrollment.class));
        verify(classHistoryRepository, never()).save(any(ClassHistory.class));
    }

    @Test
    void confirmationCreatesTargetYearRecordsWithoutChangingSourceEnrollment() {
        var summary = promotionService.confirm(request);

        assertEquals(1, summary.promoted());
        assertEquals(FROM_YEAR_ID, sourceEnrollment.getAcademicYearId());
        assertEquals(SOURCE_SECTION_ID, sourceEnrollment.getSectionId());

        ArgumentCaptor<Enrollment> enrollmentCaptor = ArgumentCaptor.forClass(Enrollment.class);
        verify(enrollmentRepository).save(enrollmentCaptor.capture());
        assertEquals(STUDENT_ID, enrollmentCaptor.getValue().getStudentId());
        assertEquals(TO_YEAR_ID, enrollmentCaptor.getValue().getAcademicYearId());
        assertEquals(TARGET_SECTION_ID, enrollmentCaptor.getValue().getSectionId());

        ArgumentCaptor<ClassHistory> historyCaptor = ArgumentCaptor.forClass(ClassHistory.class);
        verify(classHistoryRepository).save(historyCaptor.capture());
        assertEquals(7L, historyCaptor.getValue().getClassId());
        assertEquals(TARGET_SECTION_ID, historyCaptor.getValue().getSectionId());
        assertEquals(TO_YEAR_ID, historyCaptor.getValue().getAcademicYearId());
        verify(permissionService).assertStudent(STUDENT_ID, SOURCE_SECTION_ID);
        verify(auditService).record(eq("students"), eq("promote"), eq("Enrollment"), isNull(),
                contains("promoted to academic year " + TO_YEAR_ID));
        verify(auditService).record("students", "promote", "Promotion", TO_YEAR_ID, "Processed 1 students");
    }

    private SchoolClass schoolClass(Long id, String name) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(id);
        schoolClass.setSchoolId(1L);
        schoolClass.setName(name);
        return schoolClass;
    }

    private Section section(Long id, Long classId, Long yearId, String name) {
        Section section = new Section();
        section.setId(id);
        section.setClassId(classId);
        section.setAcademicYearId(yearId);
        section.setName(name);
        section.setStatus("ACTIVE");
        return section;
    }
}
