package com.schoolenterprise.staff.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.service.SchoolService;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.staff.dto.*;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository assignmentRepository;
    private final AuditService auditService;
    private final PermissionService permissionService;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final SubjectClassMappingRepository subjectClassMappingRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolService schoolService;

    public List<StaffResponse> list() {
        return staffRepository.findAll().stream().map(this::response).toList();
    }

    public Staff get(Long id) {
        return staffRepository.findById(id).orElseThrow(() -> AppException.notFound("Staff not found"));
    }

    public StaffResponse summary(Long id) {
        return response(get(id));
    }

    @Transactional
    public StaffResponse create(StaffRequest request) {
        String employeeId = request.getEmployeeId().trim();
        if (staffRepository.existsByEmployeeId(employeeId)) {
            throw AppException.badRequest("Employee ID already exists");
        }
        Staff staff = new Staff();
        apply(staff, request, true);
        Staff saved = staffRepository.save(staff);
        auditService.record("staff", "create", "Staff", saved.getId(), saved.getEmployeeId());
        return response(saved);
    }

    @Transactional
    public StaffResponse update(Long id, StaffRequest request) {
        Staff staff = get(id);
        String employeeId = request.getEmployeeId().trim();
        if (staffRepository.existsByEmployeeIdAndIdNot(employeeId, id)) {
            throw AppException.badRequest("Employee ID already exists");
        }
        String requestedStatus = request.getStatus() == null ? staff.getStatus() : request.getStatus();
        String requestedCategory = request.getStaffCategory() == null
                ? staff.getStaffCategory()
                : request.getStaffCategory().isBlank() ? null : request.getStaffCategory();
        ensureNoActiveAssignmentsForEligibilityChange(staff, requestedStatus, requestedCategory);
        apply(staff, request, false);
        Staff saved = staffRepository.save(staff);
        auditService.record("staff", "edit", "Staff", saved.getId(), saved.getEmployeeId());
        return response(saved);
    }

    @Transactional
    public StaffResponse updateStatus(Long id, String status) {
        Staff staff = get(id);
        ensureNoActiveAssignmentsForEligibilityChange(staff, status, staff.getStaffCategory());
        staff.setStatus(status);
        Staff saved = staffRepository.save(staff);
        auditService.record("staff", "edit", "Staff", saved.getId(), "Status " + status);
        return response(saved);
    }

    public List<TeacherAssignmentResponse> assignments() {
        return assignmentRepository.findAll().stream().map(this::assignmentResponse).toList();
    }

    public StaffProfileResponse profile(Long staffId) {
        Staff staff = get(staffId);
        StaffResponse response = response(staff);
        List<StaffProfileResponse.AssignmentResponse> assignments = assignmentResponses(
                assignmentRepository.findByStaffId(staffId));
        return new StaffProfileResponse(response, assignments);
    }

    public List<StaffProfileResponse.AssignmentResponse> assignments(Long staffId, Long academicYearId) {
        get(staffId);
        if (academicYearId != null) {
            permissionService.assertYearAccess(academicYearId);
        }
        List<TeacherAssignment> assignments = assignmentRepository.findByStaffId(staffId).stream()
                .filter(assignment -> academicYearId == null
                        || Objects.equals(assignment.getAcademicYearId(), academicYearId))
                .filter(this::canViewAssignment)
                .toList();
        return assignmentResponses(assignments);
    }

    private List<StaffProfileResponse.AssignmentResponse> assignmentResponses(List<TeacherAssignment> assignments) {
        return assignments.stream().map(a -> new StaffProfileResponse.AssignmentResponse(
                a.getId(), a.getSubjectId(), a.getSubjectId() == null ? null
                        : subjectRepository.findById(a.getSubjectId()).map(s -> s.getName()).orElse(null),
                a.getClassId(), classRepository.findById(a.getClassId()).map(c -> c.getName()).orElse(null),
                a.getSectionId(), a.getSectionId() == null ? null
                        : sectionRepository.findById(a.getSectionId()).map(s -> s.getName()).orElse(null),
                a.getAcademicYearId(), academicYearRepository.findById(a.getAcademicYearId())
                        .map(y -> y.getName()).orElse(null),
                a.getAssignmentType(), a.getStatus()
        )).toList();
    }

    private boolean canViewAssignment(TeacherAssignment assignment) {
        if (permissionService.hasSchoolWideAccess()) {
            return true;
        }
        return permissionService.allowedClassIds().contains(assignment.getClassId())
                || (assignment.getSectionId() != null
                    && permissionService.allowedSectionIds().contains(assignment.getSectionId()))
                || (assignment.getSubjectId() != null
                    && permissionService.allowedSubjectIds().contains(assignment.getSubjectId()));
    }

    @Transactional
    public TeacherAssignmentResponse createAssignment(TeacherAssignmentRequest request) {
        return saveAssignment(null, request);
    }

    @Transactional
    public TeacherAssignmentResponse updateAssignment(Long id, TeacherAssignmentRequest request) {
        return saveAssignment(id, request);
    }

    @Transactional
    public TeacherAssignmentResponse updateAssignmentStatus(Long id, String status) {
        TeacherAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Teacher assignment not found"));
        String normalizedStatus = status == null ? "" : status.toUpperCase();
        if (!"ACTIVE".equals(normalizedStatus) && !"INACTIVE".equals(normalizedStatus)) {
            throw AppException.badRequest("Assignment status must be ACTIVE or INACTIVE");
        }
        if ("ACTIVE".equals(normalizedStatus)) {
            requireEligibleTeacher(assignment.getStaffId());
            if ("CLASS_TEACHER".equals(assignment.getAssignmentType())) {
                Section section = sectionRepository.findById(assignment.getSectionId())
                        .orElseThrow(() -> AppException.notFound("Section not found"));
                var year = academicYearRepository.findById(assignment.getAcademicYearId())
                        .orElseThrow(() -> AppException.notFound("Academic year not found"));
                if (!"ACTIVE".equals(section.getStatus()) || !"ACTIVE".equals(year.getStatus())
                        || !Objects.equals(section.getClassId(), assignment.getClassId())
                        || !Objects.equals(section.getAcademicYearId(), assignment.getAcademicYearId())) {
                    throw AppException.badRequest("Class teacher assignment must match an active section and academic year");
                }
                boolean another = assignmentRepository.findAll().stream().anyMatch(existing ->
                        !Objects.equals(existing.getId(), assignment.getId())
                                && "ACTIVE".equals(existing.getStatus())
                                && "CLASS_TEACHER".equals(existing.getAssignmentType())
                                && Objects.equals(existing.getSectionId(), section.getId())
                                && Objects.equals(existing.getAcademicYearId(), assignment.getAcademicYearId()));
                if (another || (section.getClassTeacherStaffId() != null
                        && !section.getClassTeacherStaffId().equals(assignment.getStaffId()))) {
                    throw AppException.badRequest("Only one class teacher may be assigned to this section");
                }
                section.setClassTeacherStaffId(assignment.getStaffId());
                sectionRepository.save(section);
            }
        } else if ("CLASS_TEACHER".equals(assignment.getAssignmentType())) {
            clearClassTeacher(assignment);
        }
        assignment.setStatus(normalizedStatus);
        TeacherAssignment saved = assignmentRepository.save(assignment);
        auditService.record("staff", "edit", "TeacherAssignment", saved.getId(), "Status " + normalizedStatus);
        return assignmentResponse(saved);
    }

    @Transactional
    public void unassign(Long id) {
        TeacherAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Teacher assignment not found"));
        assignment.setStatus("INACTIVE");
        if ("CLASS_TEACHER".equals(assignment.getAssignmentType())) {
            clearClassTeacher(assignment);
        }
        assignmentRepository.save(assignment);
        auditService.record("staff", "edit", "TeacherAssignment", id, "Unassigned");
    }

    private TeacherAssignmentResponse saveAssignment(Long id, TeacherAssignmentRequest request) {
        Staff staff = get(request.getStaffId());
        requireEligibleTeacher(staff);
        var subject = request.getSubjectId() == null ? null : subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> AppException.notFound("Subject not found"));
        var schoolClass = classRepository.findById(request.getClassId())
                .orElseThrow(() -> AppException.notFound("Class not found"));
        var year = academicYearRepository.findById(request.getAcademicYearId())
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        var section = request.getSectionId() == null ? null : sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (!"ACTIVE".equals(year.getStatus())
                || (section != null && !"ACTIVE".equals(section.getStatus()))
                || (subject != null && !"ACTIVE".equals(subject.getStatus()))) {
            throw AppException.badRequest("Staff, subject, class, section and academic year must be active");
        }
        if (section != null && (!section.getClassId().equals(schoolClass.getId())
                || !section.getAcademicYearId().equals(year.getId()))) {
            throw AppException.badRequest("Section does not belong to the selected class and academic year");
        }
        String type = request.getAssignmentType().toUpperCase();
        if ("SUBJECT_TEACHER".equals(type) && subject == null) {
            throw AppException.badRequest("Subject is required for a subject teacher");
        }
        if ("SUBJECT_TEACHER".equals(type)
                && !subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(
                subject.getId(), schoolClass.getId(), year.getId())) {
            throw AppException.badRequest("Subject is not assigned to the selected class and academic year");
        }
        if ("CLASS_TEACHER".equals(type) && subject != null) {
            throw AppException.badRequest("Class teacher assignments cannot include a subject");
        }
        if ("CLASS_TEACHER".equals(type) && section == null) {
            throw AppException.badRequest("Section is required for a class teacher");
        }
        String assignmentStatus = request.getStatus() == null ? "ACTIVE" : request.getStatus().toUpperCase();
        if (!"ACTIVE".equals(assignmentStatus) && !"INACTIVE".equals(assignmentStatus)) {
            throw AppException.badRequest("Assignment status must be ACTIVE or INACTIVE");
        }
        if (!permissionService.isAdmin()) {
            permissionService.assertClass(schoolClass.getId());
            if (subject != null) permissionService.assertSubject(subject.getId());
        }
        boolean duplicate = "ACTIVE".equals(assignmentStatus) && assignmentRepository.findAll().stream().anyMatch(existing ->
                !Objects.equals(existing.getId(), id)
                        && "ACTIVE".equals(existing.getStatus())
                        && existing.getStaffId().equals(staff.getId())
                        && java.util.Objects.equals(existing.getSubjectId(), request.getSubjectId())
                        && existing.getClassId().equals(schoolClass.getId())
                        && java.util.Objects.equals(existing.getSectionId(), request.getSectionId())
                        && existing.getAcademicYearId().equals(year.getId())
                        && existing.getAssignmentType().equals(type));
        if (duplicate) throw AppException.badRequest("Duplicate teacher assignment");
        if ("CLASS_TEACHER".equals(type) && "ACTIVE".equals(assignmentStatus)) {
            boolean another = assignmentRepository.findAll().stream().anyMatch(existing ->
                    !existing.getId().equals(id) && "ACTIVE".equals(existing.getStatus())
                            && "CLASS_TEACHER".equals(existing.getAssignmentType())
                            && existing.getSectionId().equals(section.getId())
                            && existing.getAcademicYearId().equals(year.getId()));
            if (another || (section.getClassTeacherStaffId() != null
                    && !section.getClassTeacherStaffId().equals(staff.getId()))) {
                throw AppException.badRequest("Only one class teacher may be assigned to this section");
            }
            section.setClassTeacherStaffId(staff.getId());
            sectionRepository.save(section);
        }
        TeacherAssignment assignment = id == null ? new TeacherAssignment() : assignmentRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Teacher assignment not found"));
        if (id != null && "CLASS_TEACHER".equals(assignment.getAssignmentType())
                && (!"CLASS_TEACHER".equals(type) || !"ACTIVE".equals(assignmentStatus)
                || !java.util.Objects.equals(assignment.getSectionId(), request.getSectionId()))) {
            clearClassTeacher(assignment);
        }
        assignment.setStaffId(staff.getId());
        assignment.setSubjectId(request.getSubjectId());
        assignment.setClassId(schoolClass.getId());
        assignment.setSectionId(request.getSectionId());
        assignment.setAcademicYearId(year.getId());
        assignment.setAssignmentType(type);
        assignment.setStatus(assignmentStatus);
        TeacherAssignment saved = assignmentRepository.save(assignment);
        auditService.record("staff", "edit", "TeacherAssignment", saved.getId(), "Staff " + saved.getStaffId());
        return assignmentResponse(saved);
    }

    private void requireEligibleTeacher(Long staffId) {
        requireEligibleTeacher(get(staffId));
    }

    private void requireEligibleTeacher(Staff staff) {
        if (!"ACTIVE".equals(staff.getStatus()) || !"TEACHING".equals(staff.getStaffCategory())) {
            throw AppException.badRequest("Teacher assignments require active staff categorized as TEACHING");
        }
    }

    private void ensureNoActiveAssignmentsForEligibilityChange(Staff staff, String status, String category) {
        boolean eligibilityChanged = !Objects.equals(staff.getStatus(), status)
                || !Objects.equals(staff.getStaffCategory(), category);
        boolean remainsEligible = "ACTIVE".equals(status) && "TEACHING".equals(category);
        if (eligibilityChanged && !remainsEligible
                && assignmentRepository.existsByStaffIdAndStatus(staff.getId(), "ACTIVE")) {
            throw AppException.badRequest(
                    "Cannot make Staff ineligible while active teacher assignments exist. Deactivate or unassign them first.");
        }
    }

    private void apply(Staff staff, StaffRequest request, boolean creating) {
        if (!departmentRepository.existsById(request.getDepartmentId())) {
            throw AppException.badRequest("Department not found");
        }
        staff.setEmployeeId(request.getEmployeeId().trim());
        staff.setFullName(request.getFullName().trim());
        staff.setDesignation(request.getDesignation().trim());
        staff.setDepartmentId(request.getDepartmentId());
        staff.setEmail(request.getEmail().trim().toLowerCase());
        staff.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        staff.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        if (creating || request.getStaffCategory() != null) {
            String category = request.getStaffCategory();
            staff.setStaffCategory(category == null || category.isBlank() ? null : category);
        }
    }

    private StaffResponse response(Staff staff) {
        String departmentName = staff.getDepartmentId() == null ? null
                : departmentRepository.findById(staff.getDepartmentId()).map(d -> d.getName()).orElse(null);
        return new StaffResponse(staff, departmentName);
    }

    private TeacherAssignmentResponse assignmentResponse(TeacherAssignment assignment) {
        return new TeacherAssignmentResponse(assignment,
                staffRepository.findById(assignment.getStaffId()).map(Staff::getFullName).orElse(null),
                assignment.getSubjectId() == null ? null : subjectRepository.findById(assignment.getSubjectId()).map(s -> s.getName()).orElse(null),
                classRepository.findById(assignment.getClassId()).map(c -> c.getName()).orElse(null),
                assignment.getSectionId() == null ? null : sectionRepository.findById(assignment.getSectionId()).map(s -> s.getName()).orElse(null),
                academicYearRepository.findById(assignment.getAcademicYearId()).map(y -> y.getName()).orElse(null));
    }

    private void clearClassTeacher(TeacherAssignment assignment) {
        if (assignment.getSectionId() == null) return;
        sectionRepository.findById(assignment.getSectionId()).ifPresent(section -> {
            if (assignment.getStaffId().equals(section.getClassTeacherStaffId())) {
                section.setClassTeacherStaffId(null);
                sectionRepository.save(section);
            }
        });
    }
}
