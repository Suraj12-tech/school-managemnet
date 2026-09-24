package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.student.entity.*;
import com.schoolenterprise.student.dto.*;
import com.schoolenterprise.student.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassHistoryRepository classHistoryRepository;
    private final StudentDocumentRepository documentRepository;
    private final SectionRepository sectionRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final PermissionService permissionService;
    private final AuditService auditService;

    public List<Student> list() {
        if (permissionService.hasSchoolWideAccess()) {
            return studentRepository.findAll();
        }
        var sectionIds = permissionService.allowedSectionIds();
        var studentIds = permissionService.allowedStudentIds();
        if (sectionIds.isEmpty() && studentIds.isEmpty()) {
            return List.of();
        }
        return studentRepository.findAll().stream()
                .filter(student -> sectionIds.contains(student.getCurrentSectionId()) || studentIds.contains(student.getId()))
                .toList();
    }

    public Student get(Long id) {
        Student student = studentRepository.findById(id).orElseThrow(() -> AppException.notFound("Student not found"));
        permissionService.assertStudent(student.getId(), student.getCurrentSectionId());
        return student;
    }

    @Transactional
    public Student create(StudentRequest request) {
        if (studentRepository.existsByAdmissionNumber(request.getAdmissionNumber().trim())) {
            throw AppException.badRequest("Admission number already exists");
        }
        Student student = new Student();
        applyStudent(student, request);
        Student saved = studentRepository.save(student);
        if (request.getAcademicYearId() != null || request.getClassId() != null || request.getSectionId() != null) {
            if (request.getAcademicYearId() == null || request.getClassId() == null || request.getSectionId() == null) {
                throw AppException.badRequest("Academic year, class and section must be provided together");
            }
            enroll(new EnrollmentRequestBuilder(request, saved.getId()).build());
        }
        auditService.record("students", "create", "Student", saved.getId(), saved.getAdmissionNumber());
        return saved;
    }

    @Transactional
    public Student update(Long id, StudentRequest request) {
        Student student = get(id);
        String admissionNumber = request.getAdmissionNumber().trim();
        if (studentRepository.existsByAdmissionNumberAndIdNot(admissionNumber, id)) {
            throw AppException.badRequest("Admission number already exists");
        }
        applyStudent(student, request);
        Student saved = studentRepository.save(student);
        auditService.record("students", "edit", "Student", saved.getId(), saved.getAdmissionNumber());
        return saved;
    }

    @Transactional
    public Student updateStatus(Long id, String status) {
        Student student = get(id);
        student.setStatus(status);
        Student saved = studentRepository.save(student);
        auditService.record("students", "edit", "Student", saved.getId(), "Status " + status);
        return saved;
    }

    public List<GuardianSummary> guardians() {
        List<Guardian> guardians;
        if (permissionService.hasSchoolWideAccess()) {
            guardians = guardianRepository.findAll();
        } else {
            Set<Long> sectionIds = permissionService.allowedSectionIds();
            Set<Long> directStudentIds = permissionService.allowedStudentIds();
            Set<Long> studentIds = studentRepository.findAll().stream()
                    .filter(student -> sectionIds.contains(student.getCurrentSectionId())
                            || directStudentIds.contains(student.getId()))
                    .map(Student::getId)
                    .collect(Collectors.toSet());
            Set<Long> guardianIds = studentIds.stream()
                    .flatMap(id -> studentGuardianRepository.findByStudentId(id).stream())
                    .map(StudentGuardian::getGuardianId)
                    .collect(Collectors.toSet());
            guardians = guardianIds.isEmpty() ? List.of() : guardianRepository.findByIdIn(guardianIds);
        }
        return guardians.stream()
                .map(g -> new GuardianSummary(g.getId(), g.getFullName(), g.getRelationType(), g.getPhone(),
                        g.getEmail(), linkedStudentCount(g.getId()), g.getStatus(),
                        studentGuardianRepository.findByGuardianId(g.getId()).stream()
                                .map(this::linkedStudent)
                                .filter(java.util.Objects::nonNull)
                                .toList()))
                .toList();
    }

    @Transactional
    public Guardian saveGuardian(GuardianRequest request) {
        Guardian guardian = new Guardian();
        applyGuardianRequest(guardian, request);
        Guardian saved = guardianRepository.save(guardian);
        auditService.record("students", "create", "Guardian", saved.getId(), saved.getFullName());
        return saved;
    }

    @Transactional
    public Guardian updateGuardian(Long id, GuardianRequest request) {
        Guardian guardian = guardian(id);
        applyGuardianRequest(guardian, request);
        Guardian saved = guardianRepository.save(guardian);
        auditService.record("students", "edit", "Guardian", saved.getId(), saved.getFullName());
        return saved;
    }

    @Transactional
    public Guardian updateGuardianStatus(Long id, String status) {
        Guardian guardian = guardian(id);
        guardian.setStatus(status);
        Guardian saved = guardianRepository.save(guardian);
        auditService.record("students", "edit", "Guardian", saved.getId(), status);
        return saved;
    }

    public GuardianDetailsResponse guardianDetails(Long id) {
        Guardian guardian = guardian(id);
        List<LinkedStudentResponse> students = studentGuardianRepository.findByGuardianId(id).stream()
                .map(this::linkedStudent)
                .filter(java.util.Objects::nonNull)
                .toList();
        if (!permissionService.hasSchoolWideAccess() && students.isEmpty()) {
            throw AppException.notFound("Guardian not found");
        }
        return new GuardianDetailsResponse(guardian.getId(), guardian.getFullName(), guardian.getRelationType(),
                guardian.getPhone(), guardian.getEmail(), guardian.getAddress(), guardian.getOccupation(),
                guardian.isEmergencyContact(), guardian.getStatus(), students);
    }

    @Transactional
    public StudentGuardianResponse linkGuardian(Long studentId, LinkGuardianRequest request) {
        get(studentId);
        Guardian guardian = guardian(request.getGuardianId());
        if ("INACTIVE".equals(guardian.getStatus())) {
            throw AppException.badRequest("Inactive guardians cannot be linked to students");
        }
        if (studentGuardianRepository.existsByStudentIdAndGuardianId(studentId, request.getGuardianId())) {
            throw AppException.badRequest("Guardian is already linked to this student");
        }
        StudentGuardian link = new StudentGuardian();
        link.setStudentId(studentId);
        link.setGuardianId(request.getGuardianId());
        link.setRelationshipType(request.getRelationshipType());
        link.setPrimaryGuardian(request.isPrimaryGuardian());
        link.setEmergencyContact(request.isEmergencyContact());
        StudentGuardian saved = studentGuardianRepository.save(link);
        auditService.record("students", "edit", "StudentGuardian", studentId, "Guardian " + request.getGuardianId());
        return toLinkResponse(saved);
    }

    public List<StudentGuardianResponse> studentGuardians(Long studentId) {
        get(studentId);
        return studentGuardianRepository.findByStudentId(studentId).stream().map(this::toLinkResponse).toList();
    }

    public List<LinkedStudentResponse> guardianStudents(Long guardianId) {
        guardian(guardianId);
        return studentGuardianRepository.findByGuardianId(guardianId).stream()
                .map(this::linkedStudent)
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    @Transactional
    public void unlinkGuardian(Long studentId, Long guardianId) {
        get(studentId);
        guardian(guardianId);
        StudentGuardianId linkId = new StudentGuardianId(studentId, guardianId);
        if (!studentGuardianRepository.existsById(linkId)) {
            throw AppException.notFound("Guardian-student relationship not found");
        }
        studentGuardianRepository.deleteById(linkId);
        auditService.record("students", "edit", "StudentGuardian", studentId, "Guardian " + guardianId + " removed");
    }

    @Transactional
    public Enrollment enroll(EnrollmentRequest request) {
        Student student = get(request.getStudentId());
        AcademicYear year = academicYearRepository.findById(request.getAcademicYearId())
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        var schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> AppException.notFound("Class not found"));
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> AppException.notFound("Section not found"));
        if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertClass(schoolClass.getId());
            permissionService.assertStudentSection(section.getId());
        }
        if ("INACTIVE".equals(student.getStatus()) || "INACTIVE".equals(section.getStatus())
                || "ARCHIVED".equals(year.getStatus())) {
            throw AppException.badRequest("Inactive students, sections, or archived years cannot be enrolled");
        }
        if (!section.getClassId().equals(schoolClass.getId())) {
            throw AppException.badRequest("Section does not belong to the selected class");
        }
        if (!section.getAcademicYearId().equals(year.getId())) {
            throw AppException.badRequest("Section does not belong to the selected academic year");
        }
        if (enrollmentRepository.existsByStudentIdAndAcademicYearId(student.getId(), year.getId())) {
            throw AppException.badRequest("Student already has an enrollment for this academic year");
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(student.getId());
        enrollment.setSectionId(section.getId());
        enrollment.setAcademicYearId(year.getId());
        enrollment.setStatus("ENROLLED");
        enrollment.setEnrolledOn(LocalDate.now());
        enrollmentRepository.save(enrollment);

        student.setCurrentSectionId(section.getId());
        studentRepository.save(student);

        ClassHistory history = new ClassHistory();
        history.setStudentId(student.getId());
        history.setClassId(section.getClassId());
        history.setSectionId(section.getId());
        history.setAcademicYearId(year.getId());
        history.setResultStatus("ONGOING");
        classHistoryRepository.save(history);

        auditService.record("students", "edit", "Enrollment", student.getId(), "Section " + section.getId());
        return enrollment;
    }

    private static final class EnrollmentRequestBuilder {
        private final StudentRequest request;
        private final Long studentId;

        private EnrollmentRequestBuilder(StudentRequest request, Long studentId) {
            this.request = request;
            this.studentId = studentId;
        }

        private EnrollmentRequest build() {
            EnrollmentRequest enrollment = new EnrollmentRequest();
            enrollment.setStudentId(studentId);
            enrollment.setAcademicYearId(request.getAcademicYearId());
            enrollment.setClassId(request.getClassId());
            enrollment.setSectionId(request.getSectionId());
            return enrollment;
        }
    }

    private void applyStudent(Student student, StudentRequest request) {
        student.setAdmissionNumber(request.getAdmissionNumber().trim());
        student.setFirstName(request.getFirstName().trim());
        student.setLastName(request.getLastName().trim());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setGender(request.getGender());
        student.setEmail(request.getEmail() == null ? null : request.getEmail().trim().toLowerCase());
        student.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        student.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
    }

    public List<Enrollment> enrollments(Long studentId) {
        get(studentId);
        return enrollmentRepository.findByStudentId(studentId);
    }

    public List<ClassHistory> history(Long studentId) {
        get(studentId);
        return classHistoryRepository.findByStudentId(studentId);
    }

    public List<StudentDocument> documents(Long studentId) {
        get(studentId);
        return documentRepository.findByStudentId(studentId);
    }

    public StudentDocument addDocument(StudentDocument doc) {
        get(doc.getStudentId());
        return documentRepository.save(doc);
    }

    private Guardian guardian(Long id) {
        Guardian guardian = guardianRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Guardian not found"));
        if (!permissionService.hasSchoolWideAccess()) {
            boolean visible = studentGuardianRepository.findByGuardianId(id).stream()
                    .map(StudentGuardian::getStudentId)
                    .map(studentRepository::findById)
                    .flatMap(java.util.Optional::stream)
                    .anyMatch(student -> {
                        try {
                            permissionService.assertStudent(student.getId(), student.getCurrentSectionId());
                            return true;
                        } catch (AppException ex) {
                            return false;
                        }
                    });
            if (!visible) {
                throw AppException.notFound("Guardian not found");
            }
        }
        return guardian;
    }

    private void applyGuardianRequest(Guardian guardian, GuardianRequest request) {
        guardian.setFullName(request.getFullName().trim());
        guardian.setRelationType(request.getRelationType());
        guardian.setPhone(request.getPhone().trim());
        guardian.setEmail(request.getEmail().trim());
        guardian.setAddress(request.getAddress().trim());
        guardian.setOccupation(request.getOccupation() == null ? null : request.getOccupation().trim());
        guardian.setEmergencyContact(request.isEmergencyContact());
        guardian.setStatus(request.getStatus());
    }

    private StudentGuardianResponse toLinkResponse(StudentGuardian link) {
        return new StudentGuardianResponse(link.getStudentId(), link.getGuardianId(), link.getRelationshipType(),
                link.isPrimaryGuardian(), link.isEmergencyContact());
    }

    private LinkedStudentResponse linkedStudent(StudentGuardian link) {
        Student student;
        try {
            student = get(link.getStudentId());
        } catch (AppException ex) {
            if (ex.getStatus().is4xxClientError()) {
                return null;
            }
            throw ex;
        }
        String className = null;
        String sectionName = null;
        if (student.getCurrentSectionId() != null) {
            Section section = sectionRepository.findById(student.getCurrentSectionId()).orElse(null);
            if (section != null) {
                sectionName = section.getName();
                if (section.getClassId() != null) {
                    className = sectionClassName(section.getClassId());
                }
            }
        }
        return new LinkedStudentResponse(student.getId(), student.getFirstName() + " " + student.getLastName(),
                student.getAdmissionNumber(), className, sectionName, link.getRelationshipType(),
                link.isPrimaryGuardian(), link.isEmergencyContact());
    }

    private String sectionClassName(Long classId) {
        return schoolClassRepository.findById(classId).map(c -> c.getName()).orElse(null);
    }

    private long linkedStudentCount(Long guardianId) {
        if (permissionService.hasSchoolWideAccess()) {
            return studentGuardianRepository.countByGuardianId(guardianId);
        }
        return studentGuardianRepository.findByGuardianId(guardianId).stream()
                .map(StudentGuardian::getStudentId)
                .map(studentRepository::findById)
                .flatMap(java.util.Optional::stream)
                .filter(student -> {
                    try {
                        permissionService.assertStudent(student.getId(), student.getCurrentSectionId());
                        return true;
                    } catch (AppException ex) {
                        return false;
                    }
                })
                .count();
    }
}
