package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.student.entity.*;
import com.schoolenterprise.student.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

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
    private final PermissionService permissionService;
    private final AuditService auditService;

    public List<Student> list() {
        if (permissionService.hasSchoolWideAccess()) {
            return studentRepository.findAll();
        }
        return studentRepository.findByCurrentSectionIdIn(permissionService.allowedSectionIds());
    }

    public Student get(Long id) {
        Student student = studentRepository.findById(id).orElseThrow(() -> AppException.notFound("Student not found"));
        permissionService.assertStudentSection(student.getCurrentSectionId());
        return student;
    }

    @Transactional
    public Student save(Student student) {
        if (student.getId() == null && studentRepository.existsByAdmissionNumber(student.getAdmissionNumber())) {
            throw AppException.badRequest("Admission number already exists");
        }
        if (student.getStatus() == null) {
            student.setStatus("ACTIVE");
        }
        Student saved = studentRepository.save(student);
        auditService.record("students", student.getId() == null ? "create" : "edit", "Student", saved.getId(), saved.getAdmissionNumber());
        return saved;
    }

    public List<Guardian> guardians() {
        return guardianRepository.findAll();
    }

    @Transactional
    public Guardian saveGuardian(Guardian g) {
        Guardian saved = guardianRepository.save(g);
        auditService.record("students", "edit", "Guardian", saved.getId(), saved.getFullName());
        return saved;
    }

    @Transactional
    public StudentGuardian linkGuardian(Long studentId, Long guardianId, boolean primary) {
        get(studentId);
        StudentGuardian link = new StudentGuardian();
        link.setStudentId(studentId);
        link.setGuardianId(guardianId);
        link.setPrimaryGuardian(primary);
        return studentGuardianRepository.save(link);
    }

    public List<StudentGuardian> studentGuardians(Long studentId) {
        get(studentId);
        return studentGuardianRepository.findByStudentId(studentId);
    }

    @Transactional
    public Enrollment enroll(Long studentId, Long sectionId, Long academicYearId) {
        Student student = get(studentId);
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> AppException.notFound("Section not found"));
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(studentId);
        enrollment.setSectionId(sectionId);
        enrollment.setAcademicYearId(academicYearId);
        enrollment.setStatus("ENROLLED");
        enrollment.setEnrolledOn(LocalDate.now());
        enrollmentRepository.save(enrollment);

        student.setCurrentSectionId(sectionId);
        studentRepository.save(student);

        ClassHistory history = new ClassHistory();
        history.setStudentId(studentId);
        history.setClassId(section.getClassId());
        history.setSectionId(sectionId);
        history.setAcademicYearId(academicYearId);
        history.setResultStatus("ONGOING");
        classHistoryRepository.save(history);

        auditService.record("students", "edit", "Enrollment", studentId, "Section " + sectionId);
        return enrollment;
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
}
