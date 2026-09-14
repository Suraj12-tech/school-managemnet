package com.schoolenterprise.common.security;

import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.identity.entity.UserScope;
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
