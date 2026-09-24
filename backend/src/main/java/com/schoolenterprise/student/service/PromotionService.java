package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.student.dto.*;
import com.schoolenterprise.student.entity.ClassHistory;
import com.schoolenterprise.student.entity.Enrollment;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.ClassHistoryRepository;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassHistoryRepository classHistoryRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final PermissionService permissionService;
    private final AuditService auditService;

    public PromotionPreview preview(PromotionRequest request) {
        Context context = validateContext(request);
        List<Enrollment> sourceEnrollments = enrollmentRepository.findByAcademicYearId(request.getFromAcademicYearId());
        Set<Long> selectedIds = request.getStudentIds() == null || request.getStudentIds().isEmpty()
                ? null : new HashSet<>(request.getStudentIds());

        List<PromotionRow> rows = sourceEnrollments.stream()
                .filter(enrollment -> selectedIds == null || selectedIds.contains(enrollment.getStudentId()))
                .map(enrollment -> row(enrollment, context))
                .toList();
        if (rows.isEmpty()) {
            throw AppException.badRequest("No eligible students were found in the selected academic year");
        }
        return new PromotionPreview(request.getFromAcademicYearId(), request.getToAcademicYearId(), rows);
    }

    @Transactional
    public PromotionSummary confirm(PromotionRequest request) {
        Context context = validateContext(request);
        PromotionPreview preview = preview(request);
        Map<Long, PromotionDecision> decisions = decisions(request, context);
        int promoted = 0;
        int notPromoted = 0;
        int transferred = 0;
        int left = 0;

        for (PromotionRow row : preview.rows()) {
            PromotionDecision decision = decisions.get(row.studentId());
            String status = decision == null ? row.status() : decision.status();
            if ("PROMOTED".equals(status)) {
                Long classId = decision != null && decision.targetClassId() != null
                        ? decision.targetClassId() : context.targetClass().getId();
                Long sectionId = decision != null && decision.targetSectionId() != null
                        ? decision.targetSectionId() : context.targetSection().getId();
                validateTarget(classId, sectionId, context.toYear().getId());
                if (enrollmentRepository.existsByStudentIdAndAcademicYearId(row.studentId(), context.toYear().getId())) {
                    throw AppException.badRequest("Student " + row.admissionNumber() + " is already enrolled in the target academic year");
                }
                Student student = studentRepository.findById(row.studentId())
                        .orElseThrow(() -> AppException.notFound("Student not found"));
                if (!"ACTIVE".equals(student.getStatus())) {
                    throw AppException.badRequest("Inactive students cannot be promoted");
                }
                Enrollment enrollment = new Enrollment();
                enrollment.setStudentId(student.getId());
                enrollment.setSectionId(sectionId);
                enrollment.setAcademicYearId(context.toYear().getId());
                enrollment.setStatus("ENROLLED");
                enrollment.setEnrolledOn(LocalDate.now());
                enrollmentRepository.save(enrollment);

                ClassHistory history = new ClassHistory();
                history.setStudentId(student.getId());
                history.setClassId(classId);
                history.setSectionId(sectionId);
                history.setAcademicYearId(context.toYear().getId());
                history.setResultStatus("PROMOTED");
                classHistoryRepository.save(history);
                student.setCurrentSectionId(sectionId);
                studentRepository.save(student);
                auditService.record("students", "promote", "Enrollment", enrollment.getId(),
                        "Student " + student.getId() + " promoted to academic year " + context.toYear().getId());
                promoted++;
            } else if ("TRANSFERRED".equals(status)) {
                notPromoted++;
                transferred++;
                auditService.record("students", "promote", "Student", row.studentId(), "Marked TRANSFERRED");
            } else if ("LEFT".equals(status)) {
                notPromoted++;
                left++;
                auditService.record("students", "promote", "Student", row.studentId(), "Marked LEFT");
            } else {
                notPromoted++;
                auditService.record("students", "promote", "Student", row.studentId(), "Marked NOT_PROMOTED");
            }
        }
        auditService.record("students", "promote", "Promotion", context.toYear().getId(),
                "Processed " + preview.rows().size() + " students");
        return new PromotionSummary(preview.rows().size(), promoted, notPromoted, transferred, left, 0);
    }

    private Map<Long, PromotionDecision> decisions(PromotionRequest request, Context context) {
        Map<Long, PromotionDecision> result = new HashMap<>();
        if (request.getDecisions() != null) {
            for (PromotionDecision decision : request.getDecisions()) {
                if (result.put(decision.studentId(), decision) != null) {
                    throw AppException.badRequest("Duplicate promotion decision for student " + decision.studentId());
                }
            }
        }
        return result;
    }

    private PromotionRow row(Enrollment enrollment, Context context) {
        Student student = studentRepository.findById(enrollment.getStudentId())
                .orElseThrow(() -> AppException.notFound("Student not found"));
        permissionService.assertStudent(student.getId(), student.getCurrentSectionId());
        Section sourceSection = sectionRepository.findById(enrollment.getSectionId())
                .orElseThrow(() -> AppException.notFound("Source section not found"));
        String status = "ACTIVE".equals(student.getStatus()) ? "PROMOTED" : "NOT_PROMOTED";
        return new PromotionRow(student.getId(), student.getFirstName() + " " + student.getLastName(),
                student.getAdmissionNumber(), className(sourceSection.getClassId()), sourceSection.getName(),
                context.targetClass().getName(), context.targetSection().getName(), status,
                "ACTIVE".equals(student.getStatus()) ? null : "Student is inactive");
    }

    private Context validateContext(PromotionRequest request) {
        if (Objects.equals(request.getFromAcademicYearId(), request.getToAcademicYearId())) {
            throw AppException.badRequest("From and to academic years must be different");
        }
        AcademicYear from = academicYearRepository.findById(request.getFromAcademicYearId())
                .orElseThrow(() -> AppException.notFound("Source academic year not found"));
        AcademicYear to = academicYearRepository.findById(request.getToAcademicYearId())
                .orElseThrow(() -> AppException.notFound("Target academic year not found"));
        if ("ARCHIVED".equals(to.getStatus())) {
            throw AppException.badRequest("Students cannot be promoted into an archived academic year");
        }
        if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertYearAccess(from.getId());
            permissionService.assertYearAccess(to.getId());
        }
        var targetClass = schoolClassRepository.findById(request.getTargetClassId())
                .orElseThrow(() -> AppException.notFound("Target class not found"));
        Section targetSection = validateTarget(request.getTargetClassId(), request.getTargetSectionId(), to.getId());
        if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertClass(targetClass.getId());
            permissionService.assertStudentSection(targetSection.getId());
        }
        return new Context(from, to, targetClass, targetSection);
    }

    private Section validateTarget(Long classId, Long sectionId, Long yearId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> AppException.notFound("Target section not found"));
        if (!Objects.equals(section.getClassId(), classId) || !Objects.equals(section.getAcademicYearId(), yearId)) {
            throw AppException.badRequest("Target section must belong to the selected class and academic year");
        }
        if (!"ACTIVE".equals(section.getStatus())) {
            throw AppException.badRequest("Target section must be active");
        }
        return section;
    }

    private String className(Long id) {
        return schoolClassRepository.findById(id).map(c -> c.getName()).orElse("#" + id);
    }

    private record Context(AcademicYear fromYear, AcademicYear toYear,
                           com.schoolenterprise.academics.entity.SchoolClass targetClass,
                           Section targetSection) {}
}
