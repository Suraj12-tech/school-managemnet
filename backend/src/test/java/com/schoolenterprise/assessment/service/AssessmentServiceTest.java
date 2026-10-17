package com.schoolenterprise.assessment.service;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.assessment.dto.AssessmentRequest;
import com.schoolenterprise.assessment.entity.Assessment;
import com.schoolenterprise.assessment.repository.AssessmentRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {
    private static final LocalDate EXAM_DATE = LocalDate.of(2026, 10, 10);

    @Mock private AssessmentRepository assessmentRepository;
    @Mock private PermissionService permissionService;
    @Mock private TeacherScopeResolver teacherScopeResolver;
    @Mock private TeacherAssignmentRepository teacherAssignmentRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SubjectClassMappingRepository subjectClassMappingRepository;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private AuditService auditService;
    @InjectMocks private AssessmentService service;

    @Test
    void teacherListIncludesOnlyPublishedAssessmentsInActiveAssignmentScope() {
        prepareTeacher("teacher-a", scope(10L, Set.of(100L), 20L, Set.of(31L), 30L, 40L));
        Assessment own = assessment(1L, 20L, 31L, 30L, 40L, "PUBLISHED");
        Assessment otherSection = assessment(2L, 20L, 32L, 30L, 40L, "PUBLISHED");
        Assessment otherSubject = assessment(3L, 20L, 31L, 33L, 40L, "PUBLISHED");
        when(assessmentRepository.findByStatusOrderByAssessmentDateAsc("PUBLISHED"))
                .thenReturn(List.of(own, otherSection, otherSubject));
        when(teacherAssignmentRepository.findByStaffId(10L))
                .thenReturn(List.of(assignment(100L, 10L, 20L, 31L, 30L, 40L, "ACTIVE")));
        prepareAssessmentNames(own);

        var result = service.teacherAssessments();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).id());
        assertEquals("Mathematics", result.get(0).subjectName());
    }

    @Test
    void teacherCanReadOwnPublishedAssessmentDetails() {
        prepareTeacher("teacher-a", scope(10L, Set.of(100L), 20L, Set.of(31L), 30L, 40L));
        Assessment own = assessment(1L, 20L, 31L, 30L, 40L, "PUBLISHED");
        when(assessmentRepository.findById(1L)).thenReturn(Optional.of(own));
        when(teacherAssignmentRepository.findByStaffId(10L))
                .thenReturn(List.of(assignment(100L, 10L, 20L, 31L, 30L, 40L, "ACTIVE")));
        prepareAssessmentNames(own);

        assertEquals(1L, service.teacherAssessment(1L).id());
    }

    @Test
    void teachersCannotReadEachOthersAssessments() {
        Assessment assessment = assessment(1L, 20L, 31L, 30L, 40L, "PUBLISHED");
        when(assessmentRepository.findById(1L)).thenReturn(Optional.of(assessment));
        AppUserDetails firstTeacher = teacher("teacher-a");
        AppUserDetails secondTeacher = teacher("teacher-b");
        when(permissionService.currentUser()).thenReturn(firstTeacher, secondTeacher);
        when(permissionService.isTeacher(firstTeacher)).thenReturn(true);
        when(permissionService.isTeacher(secondTeacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(firstTeacher))
                .thenReturn(scope(10L, Set.of(100L), 20L, Set.of(31L), 30L, 40L));
        when(teacherScopeResolver.resolve(secondTeacher))
                .thenReturn(scope(11L, Set.of(200L), 21L, Set.of(32L), 34L, 41L));
        when(teacherAssignmentRepository.findByStaffId(10L))
                .thenReturn(List.of(assignment(100L, 10L, 20L, 31L, 30L, 40L, "ACTIVE")));
        prepareAssessmentNames(assessment);

        assertEquals(1L, service.teacherAssessment(1L).id());
        assertEquals(404, assertThrows(AppException.class, () -> service.teacherAssessment(1L))
                .getStatus().value());
        verify(classRepository).findById(20L);
    }

    @Test
    void draftAssessmentsAreNotVisibleToTeachers() {
        prepareTeacher("teacher-a", scope(10L, Set.of(100L), 20L, Set.of(31L), 30L, 40L));
        when(assessmentRepository.findByStatusOrderByAssessmentDateAsc("PUBLISHED")).thenReturn(List.of());
        Assessment draft = assessment(1L, 20L, 31L, 30L, 40L, "DRAFT");
        when(assessmentRepository.findById(1L)).thenReturn(Optional.of(draft));

        assertEquals(0, service.teacherAssessments().size());
        assertEquals(404, assertThrows(AppException.class, () -> service.teacherAssessment(1L))
                .getStatus().value());
        verify(teacherAssignmentRepository, never()).findByStaffId(any());
    }

    @Test
    void adminCanCreateAConsistentAssessmentAndCreationIsAudited() {
        when(permissionService.isAdmin()).thenReturn(true);
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L)));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section(31L, 20L, 40L)));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(30L, 20L, 40L))
                .thenReturn(true);
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(invocation -> {
            Assessment assessment = invocation.getArgument(0);
            assessment.setId(5L);
            return assessment;
        });

        var response = service.create(request(20L, 31L, 30L, 40L, EXAM_DATE, "PUBLISHED"));

        assertEquals(5L, response.id());
        assertEquals("PUBLISHED", response.status());
        verify(auditService).record("assessments", "create", "Assessment", 5L,
                "Scheduled assessment for class 20 and academic year 40");
    }

    @Test
    void nonAdminCannotCreateAssessment() {
        when(permissionService.isAdmin()).thenReturn(false);

        assertEquals(403, assertThrows(AppException.class,
                () -> service.create(request(20L, 31L, 30L, 40L, EXAM_DATE, "PUBLISHED")))
                .getStatus().value());
        verify(assessmentRepository, never()).save(any());
    }

    @Test
    void adminCannotCreateAssessmentWithMismatchedSectionOrDateOutsideYear() {
        when(permissionService.isAdmin()).thenReturn(true);
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L)));
        when(sectionRepository.findById(31L)).thenReturn(Optional.of(section(31L, 21L, 40L)));

        assertEquals(400, assertThrows(AppException.class,
                () -> service.create(request(20L, 31L, 30L, 40L, EXAM_DATE, "PUBLISHED")))
                .getStatus().value());
        verify(assessmentRepository, never()).save(any());
    }

    @Test
    void adminCannotCreateAssessmentForSubjectNotMappedToClassAndYear() {
        when(permissionService.isAdmin()).thenReturn(true);
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L)));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(30L, 20L, 40L))
                .thenReturn(false);

        assertEquals(400, assertThrows(AppException.class,
                () -> service.create(request(20L, null, 30L, 40L, EXAM_DATE, "PUBLISHED")))
                .getStatus().value());
        verify(assessmentRepository, never()).save(any());
    }

    @Test
    void adminCannotCreateAssessmentOutsideAcademicYearDateRange() {
        when(permissionService.isAdmin()).thenReturn(true);
        when(classRepository.findById(20L)).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(academicYearRepository.findById(40L)).thenReturn(Optional.of(year(40L, 1L)));

        assertEquals(400, assertThrows(AppException.class,
                () -> service.create(request(20L, null, 30L, 40L,
                        LocalDate.of(2025, 12, 31), "PUBLISHED")))
                .getStatus().value());
        verify(assessmentRepository, never()).save(any());
    }

    private void prepareTeacher(String username, TeacherScope scope) {
        AppUserDetails teacher = teacher(username);
        when(permissionService.currentUser()).thenReturn(teacher);
        when(permissionService.isTeacher(teacher)).thenReturn(true);
        when(teacherScopeResolver.resolve(teacher)).thenReturn(scope);
    }

    private AppUserDetails teacher(String username) {
        return new AppUserDetails(2L, username, "x", true,
                Set.of("SUBJECT_TEACHER"), Set.of("subjects:view"), List.of());
    }

    private TeacherScope scope(Long staffId, Set<Long> assignmentIds, Long classId,
                               Set<Long> sectionIds, Long subjectId, Long yearId) {
        return new TeacherScope(staffId, assignmentIds, Set.of(classId), sectionIds, Set.of(subjectId), Set.of(yearId));
    }

    private TeacherAssignment assignment(Long id, Long staffId, Long classId, Long sectionId,
                                         Long subjectId, Long yearId, String status) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setId(id);
        assignment.setStaffId(staffId);
        assignment.setClassId(classId);
        assignment.setSectionId(sectionId);
        assignment.setSubjectId(subjectId);
        assignment.setAcademicYearId(yearId);
        assignment.setAssignmentType("SUBJECT_TEACHER");
        assignment.setStatus(status);
        return assignment;
    }

    private Assessment assessment(Long id, Long classId, Long sectionId, Long subjectId,
                                  Long yearId, String status) {
        Assessment assessment = new Assessment();
        assessment.setId(id);
        assessment.setTitle("Unit test");
        assessment.setClassId(classId);
        assessment.setSectionId(sectionId);
        assessment.setSubjectId(subjectId);
        assessment.setAcademicYearId(yearId);
        assessment.setAssessmentDate(EXAM_DATE);
        assessment.setMaxMarks(new BigDecimal("50"));
        assessment.setStatus(status);
        return assessment;
    }

    private void prepareAssessmentNames(Assessment assessment) {
        when(classRepository.findById(assessment.getClassId())).thenReturn(Optional.of(schoolClass(20L, 1L)));
        when(sectionRepository.findById(assessment.getSectionId())).thenReturn(Optional.of(section(31L, 20L, 40L)));
        when(subjectRepository.findById(assessment.getSubjectId()))
                .thenReturn(Optional.of(subject(30L, 1L, "ACTIVE")));
        when(academicYearRepository.findById(assessment.getAcademicYearId())).thenReturn(Optional.of(year(40L, 1L)));
    }

    private AssessmentRequest request(Long classId, Long sectionId, Long subjectId, Long yearId,
                                      LocalDate date, String status) {
        return new AssessmentRequest("Unit test", classId, sectionId, subjectId, yearId,
                date, new BigDecimal("50"), status);
    }

    private SchoolClass schoolClass(Long id, Long schoolId) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(id);
        schoolClass.setSchoolId(schoolId);
        schoolClass.setName("Class One");
        return schoolClass;
    }

    private Section section(Long id, Long classId, Long yearId) {
        Section section = new Section();
        section.setId(id);
        section.setClassId(classId);
        section.setAcademicYearId(yearId);
        section.setName("A");
        section.setStatus("ACTIVE");
        return section;
    }

    private Subject subject(Long id, Long schoolId, String status) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setSchoolId(schoolId);
        subject.setName("Mathematics");
        subject.setStatus(status);
        return subject;
    }

    private AcademicYear year(Long id, Long schoolId) {
        AcademicYear year = new AcademicYear();
        year.setId(id);
        year.setSchoolId(schoolId);
        year.setName("2026-2027");
        year.setStatus("ACTIVE");
        year.setStartDate(LocalDate.of(2026, 1, 1));
        year.setEndDate(LocalDate.of(2026, 12, 31));
        return year;
    }
}
