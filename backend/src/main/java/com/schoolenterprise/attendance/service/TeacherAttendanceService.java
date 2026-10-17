package com.schoolenterprise.attendance.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.attendance.dto.AttendanceMarkRequest;
import com.schoolenterprise.attendance.dto.TeacherAttendanceRequest;
import com.schoolenterprise.attendance.dto.TeacherAttendanceResponse;
import com.schoolenterprise.attendance.entity.AttendanceRecord;
import com.schoolenterprise.attendance.repository.AttendanceRecordRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.AppUserDetails;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.common.security.TeacherScope;
import com.schoolenterprise.common.security.TeacherScopeResolver;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeacherAttendanceService {
    private static final Set<String> ALLOWED_STATUSES = Set.of("PRESENT", "ABSENT", "LATE");

    private final PermissionService permissionService;
    private final TeacherScopeResolver teacherScopeResolver;
    private final SectionRepository sectionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Transactional(readOnly = true)
    public TeacherAttendanceResponse attendance(Long sectionId, LocalDate date) {
        AuthorizedSection authorized = authorize(sectionId, date);
        List<Student> students = activeStudents(sectionId);
        Map<Long, String> existing = new HashMap<>();
        attendanceRecordRepository.findBySectionIdAndAttendanceDate(sectionId, date)
                .forEach(record -> existing.put(record.getStudentId(), record.getStatus()));

        List<TeacherAttendanceResponse.AttendanceEntry> entries = students.stream()
                .sorted(Comparator.comparing(Student::getAdmissionNumber,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(student -> new TeacherAttendanceResponse.AttendanceEntry(
                        student.getAdmissionNumber(), fullName(student), existing.get(student.getId())))
                .toList();
        return new TeacherAttendanceResponse(authorized.section().getId(), date,
                hasClassTeacherAssignment(authorized.scope(), sectionId), entries);
    }

    @Transactional
    public TeacherAttendanceResponse save(TeacherAttendanceRequest request) {
        AuthorizedSection authorized = authorize(request.sectionId(), request.date());
        requireClassTeacherAssignment(authorized.scope(), request.sectionId());
        List<AttendanceMarkRequest> requestedRecords = request.records();
        Set<String> identifiers = new HashSet<>();
        List<Student> students = new ArrayList<>(requestedRecords.size());

        for (AttendanceMarkRequest requested : requestedRecords) {
            String identifier = requested.studentIdentifier().trim();
            if (!ALLOWED_STATUSES.contains(requested.status().trim().toUpperCase(Locale.ROOT))) {
                throw AppException.badRequest("Attendance status must be PRESENT, ABSENT, or LATE");
            }
            if (!identifiers.add(identifier.toUpperCase(Locale.ROOT))) {
                throw AppException.badRequest("A student may only be included once per attendance request");
            }
            Student student = studentRepository.findByAdmissionNumber(identifier)
                    .filter(value -> "ACTIVE".equals(value.getStatus())
                            && authorized.section().getId().equals(value.getCurrentSectionId()))
                    .orElseThrow(() -> AppException.notFound("Attendance student not found"));
            students.add(student);
        }

        List<AttendanceRecord> records = new ArrayList<>(students.size());
        for (Student student : students) {
            AttendanceRecord record = attendanceRecordRepository
                    .findByStudentIdAndAttendanceDate(student.getId(), request.date())
                    .orElseGet(AttendanceRecord::new);
            if (record.getSectionId() != null
                    && (!authorized.section().getId().equals(record.getSectionId())
                    || !authorized.year().getId().equals(record.getAcademicYearId()))) {
                throw AppException.conflict("Attendance already exists for this student on the selected date");
            }
            records.add(record);
        }

        for (int index = 0; index < students.size(); index++) {
            Student student = students.get(index);
            AttendanceMarkRequest requested = requestedRecords.get(index);
            AttendanceRecord record = records.get(index);
            record.setStudentId(student.getId());
            record.setSectionId(authorized.section().getId());
            record.setAcademicYearId(authorized.year().getId());
            record.setAttendanceDate(request.date());
            record.setStatus(requested.status().trim().toUpperCase(Locale.ROOT));
            record.setMarkedByStaffId(authorized.scope().staffId());
        }
        attendanceRecordRepository.saveAll(records);
        return attendance(request.sectionId(), request.date());
    }

    private AuthorizedSection authorize(Long sectionId, LocalDate date) {
        AppUserDetails user = permissionService.currentUser();
        if (!permissionService.isTeacher(user)) {
            throw AppException.forbidden("Teacher attendance access is required");
        }
        TeacherScope scope = teacherScopeResolver.resolve(user);
        if (!scope.sectionIds().contains(sectionId)) {
            throw AppException.notFound("Section not found");
        }
        Section section = sectionRepository.findById(sectionId)
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (!scope.academicYearIds().contains(section.getAcademicYearId())) {
            throw AppException.notFound("Section not found");
        }
        AcademicYear year = academicYearRepository.findById(section.getAcademicYearId())
                .filter(value -> "ACTIVE".equals(value.getStatus()))
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (year.getStartDate() == null || year.getEndDate() == null
                || date.isBefore(year.getStartDate()) || date.isAfter(year.getEndDate())
                || date.isAfter(LocalDate.now())) {
            throw AppException.badRequest("Attendance date must be within the active academic year and not in the future");
        }
        return new AuthorizedSection(scope, section, year);
    }

    private void requireClassTeacherAssignment(TeacherScope scope, Long sectionId) {
        if (!hasClassTeacherAssignment(scope, sectionId)) {
            throw AppException.forbidden("Only the assigned class teacher may manage attendance");
        }
    }

    private boolean hasClassTeacherAssignment(TeacherScope scope, Long sectionId) {
        return teacherAssignmentRepository.findByStaffId(scope.staffId()).stream()
                .anyMatch(assignment -> scope.assignmentIds().contains(assignment.getId())
                        && "ACTIVE".equals(assignment.getStatus())
                        && "CLASS_TEACHER".equals(assignment.getAssignmentType())
                        && sectionId.equals(assignment.getSectionId()));
    }

    private List<Student> activeStudents(Long sectionId) {
        return studentRepository.findByCurrentSectionIdIn(List.of(sectionId)).stream()
                .filter(student -> "ACTIVE".equals(student.getStatus())
                        && sectionId.equals(student.getCurrentSectionId()))
                .toList();
    }

    private String fullName(Student student) {
        return ((student.getFirstName() == null ? "" : student.getFirstName().trim()) + " "
                + (student.getLastName() == null ? "" : student.getLastName().trim())).trim();
    }

    private record AuthorizedSection(TeacherScope scope, Section section, AcademicYear year) {
    }
}
