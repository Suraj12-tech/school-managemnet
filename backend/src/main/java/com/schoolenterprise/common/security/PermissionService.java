package com.schoolenterprise.common.security;

import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

/**
 * Backend permission checks. UI hiding is extra; this is the real gate.
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;

    public AppUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserDetails details)) {
            throw AppException.unauthorized("Please login");
        }
        return details;
    }

    public void require(String module, String action) {
        AppUserDetails user = currentUser();
        if (isAdmin(user)) {
            return;
        }
        String key = module + ":" + action;
        if (!user.getPermissions().contains(key)) {
            throw AppException.forbidden("Missing permission " + key);
        }
        if (("fees".equals(module) || "finance".equals(module)) && !hasFinancialAccess(user)) {
            throw AppException.forbidden("Fee access is financial and must be granted on a FINANCIAL role");
        }
        if ("staff".equals(module) && !isViewAction(action) && !hasHrAccess(user)) {
            throw AppException.forbidden("Staff write access is HR-restricted");
        }
    }

    private boolean isViewAction(String action) {
        return "view".equals(action) || "export".equals(action);
    }

    public boolean hasFinancialAccess() {
        return hasFinancialAccess(currentUser());
    }

    public boolean hasFinancialAccess(AppUserDetails user) {
        if (isAdmin(user)) {
            return true;
        }
        Set<String> sensitivities = user.getRoleSensitivities();
        return sensitivities != null && sensitivities.contains("FINANCIAL");
    }

    public boolean hasHrAccess(AppUserDetails user) {
        if (isAdmin(user)) {
            return true;
        }
        Set<String> sensitivities = user.getRoleSensitivities();
        return sensitivities != null && (sensitivities.contains("HR_RESTRICTED") || sensitivities.contains("FINANCIAL"));
    }

    public boolean canAccessHistoricalYears() {
        AppUserDetails user = currentUser();
        return isAdmin(user)
                || user.getPermissions().contains("fees:export")
                || user.getPermissions().contains("school:edit");
    }

    public Long currentAcademicYearId() {
        return academicYearRepository.findAll().stream()
                .filter(AcademicYear::isCurrentYear)
                .map(AcademicYear::getId)
                .findFirst()
                .orElse(null);
    }

    public void assertYearAccess(Long yearId) {
        if (yearId == null || canAccessHistoricalYears()) {
            return;
        }
        Long currentId = currentAcademicYearId();
        if (currentId != null && !currentId.equals(yearId)) {
            throw AppException.forbidden("Historical academic-year data is outside your time scope");
        }
    }

    public boolean isAdmin() {
        return isAdmin(currentUser());
    }

    public boolean isAdmin(AppUserDetails user) {
        return user.getRoles().contains("ADMIN");
    }

    public boolean hasSchoolWideAccess() {
        AppUserDetails user = currentUser();
        if (isAdmin(user)) {
            return true;
        }
        return user.getScopes().stream().anyMatch(s -> "SCHOOL".equals(s.getScopeType()) || "CAMPUS".equals(s.getScopeType()));
    }

    /**
     * Section IDs this user may see. Empty set + school-wide means "all sections".
     */
    public Set<Long> allowedSectionIds() {
        AppUserDetails user = currentUser();
        Set<Long> ids = new HashSet<>();
        for (UserScope scope : user.getScopes()) {
            if ("SECTION".equals(scope.getScopeType())) {
                ids.add(scope.getScopeId());
            }
        }
        for (UserScope scope : user.getScopes()) {
            if ("CLASS".equals(scope.getScopeType())) {
                sectionRepository.findByClassId(scope.getScopeId()).forEach(section -> ids.add(section.getId()));
            }
        }
        staffRepository.findByUserId(user.getUserId()).ifPresent(staff -> {
            teacherAssignmentRepository.findByStaffId(staff.getId()).forEach(a -> {
                if (a.getSectionId() != null) {
                    ids.add(a.getSectionId());
                }
            });
        });
        return ids;
    }

    public Set<Long> allowedClassIds() {
        AppUserDetails user = currentUser();
        Set<Long> ids = new HashSet<>();
        for (UserScope scope : user.getScopes()) {
            if ("CLASS".equals(scope.getScopeType())) {
                ids.add(scope.getScopeId());
            }
        }
        staffRepository.findByUserId(user.getUserId()).ifPresent(staff -> {
            teacherAssignmentRepository.findByStaffId(staff.getId()).forEach(a -> ids.add(a.getClassId()));
        });
        return ids;
    }

    public Set<Long> allowedSubjectIds() {
        AppUserDetails user = currentUser();
        Set<Long> ids = new HashSet<>();
        for (UserScope scope : user.getScopes()) {
            if ("SUBJECT".equals(scope.getScopeType())) {
                ids.add(scope.getScopeId());
            }
        }
        staffRepository.findByUserId(user.getUserId()).ifPresent(staff -> {
            teacherAssignmentRepository.findByStaffId(staff.getId()).forEach(a -> ids.add(a.getSubjectId()));
        });
        return ids;
    }

    public void assertStudentSection(Long sectionId) {
        if (hasSchoolWideAccess()) {
            return;
        }
        Set<Long> sections = allowedSectionIds();
        if (sectionId != null && sections.contains(sectionId)) {
            return;
        }
        throw AppException.forbidden("This student is outside your assigned scope");
    }

    public Set<Long> allowedStudentIds() {
        AppUserDetails user = currentUser();
        Set<Long> ids = new HashSet<>();
        for (UserScope scope : user.getScopes()) {
            if ("STUDENT".equals(scope.getScopeType()) || "ASSIGNED_STUDENT".equals(scope.getScopeType())) {
                ids.add(scope.getScopeId());
            }
        }
        return ids;
    }

    public void assertStudent(Long studentId, Long sectionId) {
        if (hasSchoolWideAccess()) {
            return;
        }
        if (studentId != null && allowedStudentIds().contains(studentId)) {
            return;
        }
        assertStudentSection(sectionId);
    }

    public boolean canAssignScope(String scopeType, Long scopeId) {
        AppUserDetails user = currentUser();
        if (isAdmin(user)) {
            return true;
        }
        return user.getScopes().stream()
                .anyMatch(scope -> "SCHOOL".equals(scope.getScopeType())
                        || (scope.getScopeType().equals(scopeType) && scope.getScopeId().equals(scopeId)));
    }

    public void assertClass(Long classId) {
        if (hasSchoolWideAccess()) {
            return;
        }
        if (classId != null && allowedClassIds().contains(classId)) {
            return;
        }
        throw AppException.forbidden("This class is outside your assigned scope");
    }

    public void assertSubject(Long subjectId) {
        if (hasSchoolWideAccess()) {
            return;
        }
        if (subjectId != null && allowedSubjectIds().contains(subjectId)) {
            return;
        }
        throw AppException.forbidden("This subject is outside your assigned scope");
    }
}
