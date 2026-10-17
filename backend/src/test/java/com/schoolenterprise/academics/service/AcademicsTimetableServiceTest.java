package com.schoolenterprise.academics.service;

import com.schoolenterprise.academics.dto.TimetableEntryRequest;
import com.schoolenterprise.academics.dto.TimetableEntryResponse;
import com.schoolenterprise.academics.dto.TimetableWorkingDaysRequest;
import com.schoolenterprise.academics.dto.TimetableWorkingDaysResponse;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.SchoolWorkingDay;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.entity.TimetableEntry;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SchoolWorkingDayRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.repository.TimetableEntryRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicsTimetableServiceTest {
    @Mock private DepartmentRepository departmentRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private SubjectClassMappingRepository subjectClassMappingRepository;
    @Mock private SchoolClassRepository classRepository;
    @Mock private SectionRepository sectionRepository;
    @Mock private TimetableEntryRepository timetableEntryRepository;
    @Mock private SchoolWorkingDayRepository schoolWorkingDayRepository;
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
    void workingDaysReadAsEmptyWhenSchoolHasNoConfiguration() {
        School school = school(1L);
        when(schoolService.getSchool()).thenReturn(school);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());

        assertEquals(List.of(), academicsService.timetableWorkingDays().days());
    }

    @Test
    void workingDaysReadInConfiguredOrder() {
        School school = school(1L);
        when(schoolService.getSchool()).thenReturn(school);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(
                        workingDay(1L, "WEDNESDAY", 1),
                        workingDay(1L, "MONDAY", 2),
                        workingDay(1L, "FRIDAY", 3)));

        assertEquals(List.of("WEDNESDAY", "MONDAY", "FRIDAY"),
                academicsService.timetableWorkingDays().days());
    }

    @Test
    void replacesWorkingDaysInNormalizedSuppliedOrder() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());

        TimetableWorkingDaysResponse response = academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of(" monday ", "wEdNeSdAy", "FRIDAY")));

        assertEquals(List.of("MONDAY", "WEDNESDAY", "FRIDAY"), response.days());
        verify(schoolWorkingDayRepository).deleteBySchoolId(1L);
        verify(schoolWorkingDayRepository).saveAll(argThat(days ->
                workingDaysMatch(days, 1L, "MONDAY", "WEDNESDAY", "FRIDAY")));
    }

    @Test
    void rejectsInvalidAndDuplicateWorkingDaysWithoutReplacingConfiguration() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);

        assertBadRequest(() -> academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of("FUNDAY"))), "valid weekday");
        assertBadRequest(() -> academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of("MONDAY", " monday "))), "duplicates");

        verify(schoolWorkingDayRepository, never()).deleteBySchoolId(1L);
    }

    @Test
    void acceptsAnEmptyWorkingDayConfiguration() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(workingDay(1L, "MONDAY", 1)));

        TimetableWorkingDaysResponse response = academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of()));

        assertEquals(List.of(), response.days());
        verify(schoolWorkingDayRepository).deleteBySchoolId(1L);
        verify(schoolWorkingDayRepository).saveAll(argThat(days -> !days.iterator().hasNext()));
    }

    @Test
    void rejectsRemovingAConfiguredDayWithEntriesWithoutPartialReplacement() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(workingDay(1L, "MONDAY", 1), workingDay(1L, "TUESDAY", 2)));
        when(timetableEntryRepository.countBySchoolIdAndDayOfWeekIn(1L, List.of("MONDAY")))
                .thenReturn(1L);

        assertBadRequest(() -> academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of("TUESDAY"))), "timetable entries");

        verify(schoolWorkingDayRepository, never()).deleteBySchoolId(1L);
        verify(schoolWorkingDayRepository, never()).saveAll(any());
    }

    @Test
    void allowsRemovingAnUnusedConfiguredDay() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(workingDay(1L, "MONDAY", 1), workingDay(1L, "TUESDAY", 2)));

        TimetableWorkingDaysResponse response = academicsService.replaceTimetableWorkingDays(
                new TimetableWorkingDaysRequest(List.of("TUESDAY")));

        assertEquals(List.of("TUESDAY"), response.days());
        verify(timetableEntryRepository).countBySchoolIdAndDayOfWeekIn(1L, List.of("MONDAY"));
        verify(schoolWorkingDayRepository).deleteBySchoolId(1L);
        verify(schoolWorkingDayRepository).saveAll(argThat(days ->
                workingDaysMatch(days, 1L, "TUESDAY")));
    }

    @Test
    void scopesWorkingDayReadsAndWritesToTheResolvedSchool() {
        when(schoolService.getSchool()).thenReturn(school(2L));
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(2L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(2L))
                .thenReturn(List.of(workingDay(2L, "MONDAY", 1)));

        assertEquals(List.of("MONDAY"), academicsService.timetableWorkingDays().days());
        academicsService.replaceTimetableWorkingDays(new TimetableWorkingDaysRequest(List.of("MONDAY")));

        verify(schoolWorkingDayRepository, times(2)).findBySchoolIdOrderByDisplayOrderAsc(2L);
        verify(schoolWorkingDayRepository, never()).findBySchoolIdOrderByDisplayOrderAsc(eq(1L));
        verify(schoolWorkingDayRepository).deleteBySchoolId(2L);
        verify(schoolWorkingDayRepository, never()).deleteBySchoolId(eq(1L));
        verify(schoolWorkingDayRepository).saveAll(argThat(days ->
                workingDaysMatch(days, 2L, "MONDAY")));
    }

    @Test
    void rejectsInvalidWeekdayAndNormalizesValidWeekday() {
        assertBadRequest(timetableRequest("Funday", 1), "valid weekday");
        configureValidRequest(List.of(), List.of());

        TimetableEntryResponse response = academicsService.saveTimetableEntry(null,
                timetableRequest(" monday ", 1));

        assertEquals("MONDAY", response.getDayOfWeek());
    }

    @Test
    void rejectsPeriodValuesOutsideExistingOneThroughTwelveRange() {
        assertBadRequest(timetableRequest("MONDAY", 0), "between 1 and 12");
        assertBadRequest(timetableRequest("MONDAY", 13), "between 1 and 12");
        assertBadRequest(timetableRequest("MONDAY", null), "between 1 and 12");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void rejectsTimetableWritesWhenWorkingDaysAreNotConfigured() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of());

        assertBadRequest(timetableRequest("MONDAY", 1), "Configure at least one working day");
        assertBadRequest(() -> academicsService.saveTimetableEntry(7L, timetableRequest("MONDAY", 1)),
                "Configure at least one working day");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void rejectsValidButUnconfiguredWeekday() {
        when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(workingDay(1L, "MONDAY", 1)));

        assertBadRequest(timetableRequest("TUESDAY", 1), "not configured");
        assertBadRequest(() -> academicsService.saveTimetableEntry(7L, timetableRequest("TUESDAY", 1)),
                "not configured");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void acceptsExistingPeriodRangeBoundaries() {
        configureValidRequest(List.of(), List.of());
        assertEquals(1, academicsService.saveTimetableEntry(null,
                timetableRequest("MONDAY", 1)).getPeriodNumber());
        assertEquals(12, academicsService.saveTimetableEntry(null,
                timetableRequest("MONDAY", 12)).getPeriodNumber());
    }

    @Test
    void rejectsUnsupportedStatusValues() {
        TimetableEntryRequest request = timetableRequest("MONDAY", 1);
        request.setStatus("CANCELLED");

        assertBadRequest(request, "Status must be ACTIVE or INACTIVE");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void rejectsTeacherAlreadyScheduledInTheSameSlot() {
        TimetableEntry existing = entry(2L, 200L, 40L, "ROOM-2", "MONDAY", 3);
        configureValidRequest(List.of(), List.of(existing));

        assertBadRequest(timetableRequest("MONDAY", 3), "Teacher");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void rejectsRoomAlreadyOccupiedInTheSameSlot() {
        TimetableEntry existing = entry(2L, 200L, 41L, "  room-a  ", "MONDAY", 3);
        configureValidRequest(List.of(), List.of(existing));

        TimetableEntryRequest request = timetableRequest("MONDAY", 3);
        request.setRoom("ROOM-A");
        assertBadRequest(request, "already occupied");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void allowsDifferentSectionsOfTheSameClassAtTheSameTimeWithoutTeacherOrRoomConflicts() {
        TimetableEntry otherSection = entry(2L, 200L, 41L, "ROOM-B", "MONDAY", 3);
        configureValidRequest(List.of(), List.of(otherSection));

        TimetableEntryResponse response = academicsService.saveTimetableEntry(null,
                timetableRequest("MONDAY", 3));

        assertEquals(100L, response.getSectionId());
    }

    @Test
    void allowsMissingRoomEvenWhenAnotherSectionHasAnUnrelatedRoomInThatSlot() {
        TimetableEntry otherSection = entry(2L, 200L, 41L, "ROOM-A", "MONDAY", 3);
        configureValidRequest(List.of(), List.of(otherSection));

        TimetableEntryResponse response = academicsService.saveTimetableEntry(null,
                timetableRequest("MONDAY", 3));

        org.junit.jupiter.api.Assertions.assertNull(response.getRoom());
    }

    @Test
    void rejectsDuplicateSectionSlot() {
        TimetableEntry sameSection = entry(2L, 100L, 41L, "ROOM-B", "MONDAY", 3);
        configureValidRequest(List.of(sameSection), List.of(sameSection));

        assertBadRequest(timetableRequest("MONDAY", 3), "already has a class scheduled");
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    @Test
    void updateExcludesItsOwnEntryFromAllConflictChecks() {
        TimetableEntry existing = entry(7L, 100L, 40L, "ROOM-A", "MONDAY", 3);
        configureValidRequest(List.of(existing), List.of(existing));
        when(timetableEntryRepository.findById(7L)).thenReturn(Optional.of(existing));

        TimetableEntryResponse response = academicsService.saveTimetableEntry(7L,
                timetableRequest("MONDAY", 3));

        assertEquals(7L, response.getId());
    }

    @Test
    void updateStillRejectsAConflictWithAnotherEntry() {
        TimetableEntry ownEntry = entry(7L, 100L, 40L, "ROOM-A", "MONDAY", 3);
        TimetableEntry otherEntry = entry(8L, 100L, 41L, "ROOM-B", "MONDAY", 3);
        configureValidRequest(List.of(ownEntry, otherEntry), List.of(ownEntry, otherEntry));

        assertBadRequest(timetableRequest("MONDAY", 3), "already has a class scheduled", 7L);
        verify(timetableEntryRepository, never()).save(any(TimetableEntry.class));
    }

    private void configureValidRequest(List<TimetableEntry> sectionEntries,
                                       List<TimetableEntry> schoolYearEntries) {
        School school = new School();
        school.setId(1L);
        when(schoolService.getSchool()).thenReturn(school);
        lenient().when(schoolService.lockCurrentSchoolForUpdate()).thenReturn(1L);
        when(schoolService.year(20L)).thenReturn(academicYear());
        when(classRepository.findById(10L)).thenReturn(Optional.of(schoolClass()));
        when(sectionRepository.findById(100L)).thenReturn(Optional.of(section(100L)));
        lenient().when(academicYearRepository.findById(20L)).thenReturn(Optional.of(academicYear()));
        when(subjectRepository.findById(30L)).thenReturn(Optional.of(subject()));
        when(staffRepository.findById(40L)).thenReturn(Optional.of(staff()));
        when(subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(30L, 10L, 20L))
                .thenReturn(true);
        when(teacherAssignmentRepository.findAll()).thenReturn(List.of(assignment()));
        lenient().when(schoolWorkingDayRepository.findBySchoolIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(workingDay(1L, "MONDAY", 1)));
        when(timetableEntryRepository.findBySectionIdAndAcademicYearId(100L, 20L))
                .thenReturn(sectionEntries);
        lenient().when(timetableEntryRepository.findBySchoolIdAndAcademicYearId(1L, 20L))
                .thenReturn(schoolYearEntries);
        lenient().when(timetableEntryRepository.save(any(TimetableEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void assertBadRequest(TimetableEntryRequest request, String messagePart) {
        assertBadRequest(request, messagePart, null);
    }

    private void assertBadRequest(Runnable action, String messagePart) {
        AppException exception = assertThrows(AppException.class, action::run);
        assertEquals(400, exception.getStatus().value());
        org.junit.jupiter.api.Assertions.assertTrue(exception.getMessage().contains(messagePart));
    }

    private void assertBadRequest(TimetableEntryRequest request, String messagePart, Long id) {
        AppException exception = assertThrows(AppException.class,
                () -> academicsService.saveTimetableEntry(id, request));
        assertEquals(400, exception.getStatus().value());
        org.junit.jupiter.api.Assertions.assertTrue(exception.getMessage().contains(messagePart));
    }

    private TimetableEntryRequest timetableRequest(String day, Integer period) {
        TimetableEntryRequest request = new TimetableEntryRequest();
        request.setClassId(10L);
        request.setSectionId(100L);
        request.setAcademicYearId(20L);
        request.setDayOfWeek(day);
        request.setPeriodNumber(period);
        request.setSubjectId(30L);
        request.setStaffId(40L);
        return request;
    }

    private SchoolClass schoolClass() {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(10L);
        schoolClass.setSchoolId(1L);
        schoolClass.setName("Class 1");
        return schoolClass;
    }

    private School school(Long id) {
        School school = new School();
        school.setId(id);
        return school;
    }

    private Section section(Long id) {
        Section section = new Section();
        section.setId(id);
        section.setClassId(10L);
        section.setAcademicYearId(20L);
        section.setName(id.equals(100L) ? "A" : "B");
        section.setStatus("ACTIVE");
        return section;
    }

    private AcademicYear academicYear() {
        AcademicYear year = new AcademicYear();
        year.setId(20L);
        year.setSchoolId(1L);
        year.setName("2026-2027");
        year.setStatus("ACTIVE");
        return year;
    }

    private Subject subject() {
        Subject subject = new Subject();
        subject.setId(30L);
        subject.setSchoolId(1L);
        subject.setName("Mathematics");
        subject.setStatus("ACTIVE");
        return subject;
    }

    private Staff staff() {
        Staff staff = new Staff();
        staff.setId(40L);
        staff.setFullName("Teacher One");
        staff.setStatus("ACTIVE");
        return staff;
    }

    private TeacherAssignment assignment() {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setStaffId(40L);
        assignment.setClassId(10L);
        assignment.setAcademicYearId(20L);
        assignment.setStatus("ACTIVE");
        return assignment;
    }

    private TimetableEntry entry(Long id, Long sectionId, Long staffId, String room,
                                 String day, Integer period) {
        TimetableEntry entry = new TimetableEntry();
        entry.setId(id);
        entry.setSchoolId(1L);
        entry.setClassId(10L);
        entry.setSectionId(sectionId);
        entry.setAcademicYearId(20L);
        entry.setStaffId(staffId);
        entry.setRoom(room);
        entry.setDayOfWeek(day);
        entry.setPeriodNumber(period);
        entry.setStatus("ACTIVE");
        return entry;
    }

    private SchoolWorkingDay workingDay(Long schoolId, String day, Integer order) {
        SchoolWorkingDay workingDay = new SchoolWorkingDay();
        workingDay.setSchoolId(schoolId);
        workingDay.setDayOfWeek(day);
        workingDay.setDisplayOrder(order);
        return workingDay;
    }

    private boolean workingDaysMatch(Iterable<SchoolWorkingDay> rows, Long schoolId, String... dayNames) {
        List<SchoolWorkingDay> days = new java.util.ArrayList<>();
        rows.forEach(days::add);
        if (days.size() != dayNames.length) {
            return false;
        }
        for (int i = 0; i < dayNames.length; i++) {
            if (!schoolId.equals(days.get(i).getSchoolId())
                    || !dayNames[i].equals(days.get(i).getDayOfWeek())
                    || !Integer.valueOf(i + 1).equals(days.get(i).getDisplayOrder())) {
                return false;
            }
        }
        return true;
    }
}
