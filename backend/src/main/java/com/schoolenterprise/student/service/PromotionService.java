package com.schoolenterprise.student.service;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.SchoolClass;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private static final Pattern CLASS_LEVEL = Pattern.compile("^(.*?)(\\d+)\\s*$");

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
        List<Enrollment> sourceEnrollments = enrollmentRepository.findCurrentEnrollmentsForPromotion(
                request.getFromAcademicYearId(), context.sourceClass().getId());
        Set<Long> selectedIds = request.getStudentIds() == null || request.getStudentIds().isEmpty()
                ? null : new HashSet<>(request.getStudentIds());

        List<PromotionRow> rows = sourceEnrollments.stream()
                .filter(enrollment -> selectedIds == null || selectedIds.contains(enrollment.getStudentId()))
                .map(enrollment -> row(enrollment, context))
                .toList();
        if (rows.isEmpty()) {
            throw AppException.badRequest("No students were found in the selected source class and academic year.");
        }
        return new PromotionPreview(request.getFromAcademicYearId(), request.getToAcademicYearId(),
                context.sourceClass().getName(), context.targetClass().getName(), rows);
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
        int failed = 0;

        for (PromotionRow row : preview.rows()) {
            if (row.promotionBlocked()) {
                notPromoted++;
                failed++;
                auditService.record("students", "promote", "Student", row.studentId(),
                        "Skipped promotion: " + row.issue());
                continue;
            }
            PromotionDecision decision = decisions.get(row.studentId());
            String status = decision == null ? row.status() : decision.status();
            if ("PROMOTED".equals(status)) {
                Section sourceSection = context.sourceSectionsByName().get(sectionKey(row.currentSection()));
                if (sourceSection == null) {
                    throw AppException.badRequest("Student is not enrolled in a valid source-year section.");
                }
                Section targetSection = context.targetSectionsByName().get(sectionKey(sourceSection.getName()));
                if (targetSection == null) {
                    throw AppException.badRequest("Section " + sourceSection.getName() + " is not available for "
                            + context.targetClass().getName() + " in the target academic year. Please create the "
                            + "section before promoting students.");
                }
                permissionService.assertStudentSection(targetSection.getId());
                Student student = studentRepository.findById(row.studentId())
                        .orElseThrow(() -> AppException.notFound("Student not found"));
                if (!"ACTIVE".equals(student.getStatus())) {
                    notPromoted++;
                    failed++;
                    continue;
                }
                if (enrollmentRepository.existsByStudentIdAndAcademicYearId(
                        student.getId(), context.toYear().getId())) {
                    notPromoted++;
                    failed++;
                    auditService.record("students", "promote", "Student", student.getId(),
                            "Skipped: already enrolled in target academic year");
                    continue;
                }
                Enrollment enrollment = new Enrollment();
                enrollment.setStudentId(student.getId());
                enrollment.setSectionId(targetSection.getId());
                enrollment.setAcademicYearId(context.toYear().getId());
                enrollment.setStatus("ENROLLED");
                enrollment.setEnrolledOn(LocalDate.now());
                enrollmentRepository.save(enrollment);

                ClassHistory history = new ClassHistory();
                history.setStudentId(student.getId());
                history.setClassId(context.targetClass().getId());
                history.setSectionId(targetSection.getId());
                history.setAcademicYearId(context.toYear().getId());
                history.setResultStatus("PROMOTED");
                classHistoryRepository.save(history);
                student.setCurrentSectionId(targetSection.getId());
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
        return new PromotionSummary(preview.rows().size(), promoted, notPromoted, transferred, left, failed);
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
        if (!Objects.equals(sourceSection.getAcademicYearId(), context.fromYear().getId())
                || !Objects.equals(sourceSection.getClassId(), context.sourceClass().getId())
                || !Objects.equals(student.getCurrentSectionId(), sourceSection.getId())) {
            throw AppException.badRequest("Student is not currently enrolled in the selected source class and year.");
        }
        Section targetSection = context.targetSectionsByName().get(sectionKey(sourceSection.getName()));
        boolean alreadyEnrolled = enrollmentRepository.existsByStudentIdAndAcademicYearId(
                student.getId(), context.toYear().getId());
        String issue = null;
        boolean blocked = false;
        String status = "PROMOTED";
        if (alreadyEnrolled) {
            issue = "Student is already enrolled in the target academic year.";
            blocked = true;
            status = "NOT_PROMOTED";
        } else if (!"ACTIVE".equals(student.getStatus())) {
            issue = "Student is inactive.";
            blocked = true;
            status = "NOT_PROMOTED";
        } else if (targetSection == null) {
            issue = "Section " + sourceSection.getName() + " is not available for "
                    + context.targetClass().getName() + " in the target academic year. Please create the section "
                    + "before promoting students.";
            blocked = true;
            status = "NOT_PROMOTED";
        } else if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertStudentSection(targetSection.getId());
        }
        return new PromotionRow(student.getId(), student.getFirstName() + " " + student.getLastName(),
                student.getAdmissionNumber(), className(sourceSection.getClassId()), sourceSection.getName(),
                context.targetClass().getName(), targetSection == null ? null : targetSection.getName(),
                status, issue, blocked);
    }

    private String nextClassName(String name) {
        if (name == null) {
            return null;
        }
        Matcher matcher = CLASS_LEVEL.matcher(name.trim());
        if (!matcher.matches()) {
            return null;
        }
        int nextNumber = Integer.parseInt(matcher.group(2)) + 1;
        return matcher.group(1) + nextNumber;
    }

    private Context validateContext(PromotionRequest request) {
        if (Objects.equals(request.getFromAcademicYearId(), request.getToAcademicYearId())) {
            throw AppException.badRequest("Source and target academic years must be different.");
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
        SchoolClass sourceClass = schoolClassRepository.findById(request.getSourceClassId())
                .orElseThrow(() -> AppException.notFound("Source class not found"));
        if (!Objects.equals(sourceClass.getSchoolId(), from.getSchoolId())
                || !Objects.equals(from.getSchoolId(), to.getSchoolId())) {
            throw AppException.badRequest("Selected classes and academic years must belong to the same school.");
        }
        if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertClass(sourceClass.getId());
        }
        String targetClassName = nextClassName(sourceClass.getName());
        if (targetClassName == null) {
            throw AppException.badRequest("Cannot determine the next class for " + sourceClass.getName()
                    + ". Class names must end with a class number.");
        }
        SchoolClass targetClass = schoolClassRepository.findBySchoolId(sourceClass.getSchoolId()).stream()
                .filter(schoolClass -> schoolClass.getName() != null
                        && schoolClass.getName().equalsIgnoreCase(targetClassName))
                .findFirst()
                .orElseThrow(() -> AppException.badRequest("No next class is configured after "
                        + sourceClass.getName() + "."));
        if (!permissionService.hasSchoolWideAccess()) {
            permissionService.assertClass(targetClass.getId());
        }
        List<Section> sourceSections = sectionRepository.findByClassId(sourceClass.getId()).stream()
                .filter(section -> Objects.equals(section.getAcademicYearId(), from.getId()))
                .filter(section -> "ACTIVE".equals(section.getStatus()))
                .toList();
        Map<String, Section> sourceSectionsByName = sourceSections.stream()
                .collect(java.util.stream.Collectors.toMap(
                        section -> sectionKey(section.getName()), section -> section, (first, ignored) -> first));
        List<Section> targetSections = sectionRepository.findByClassId(targetClass.getId()).stream()
                .filter(section -> Objects.equals(section.getAcademicYearId(), to.getId()))
                .filter(section -> "ACTIVE".equals(section.getStatus()))
                .toList();
        Map<String, Section> targetSectionsByName = targetSections.stream()
                .collect(java.util.stream.Collectors.toMap(
                        section -> sectionKey(section.getName()), section -> section, (first, ignored) -> first));
        return new Context(from, to, sourceClass, targetClass, sourceSectionsByName, targetSectionsByName);
    }

    private String sectionKey(String name) {
        return name == null ? "" : name.trim().toUpperCase(Locale.ROOT);
    }

    private String className(Long id) {
        return schoolClassRepository.findById(id).map(c -> c.getName()).orElse("#" + id);
    }

    private record Context(AcademicYear fromYear, AcademicYear toYear, SchoolClass sourceClass,
                           SchoolClass targetClass, Map<String, Section> sourceSectionsByName,
                           Map<String, Section> targetSectionsByName) {}
}
