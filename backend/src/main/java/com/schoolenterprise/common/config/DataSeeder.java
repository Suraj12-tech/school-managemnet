package com.schoolenterprise.common.config;

import com.schoolenterprise.identity.entity.AppUser;
import com.schoolenterprise.identity.entity.Permission;
import com.schoolenterprise.identity.entity.Role;
import com.schoolenterprise.identity.entity.UserScope;
import com.schoolenterprise.identity.repository.AppUserRepository;
import com.schoolenterprise.identity.repository.PermissionRepository;
import com.schoolenterprise.identity.repository.RoleRepository;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.repository.SchoolRepository;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Creates demo school + admin user the first time the app starts.
 * Login: admin / Admin@123
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String[] MODULES = {
            "students", "staff", "classes", "subjects", "fees", "users", "school", "audit", "dashboard"
    };
    private static final String[] ACTIONS = {
            "view", "create", "edit", "delete", "approve", "publish", "export"
    };

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final AcademicYearRepository academicYearRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedPermissions();
        Role adminRole = seedRole("ADMIN", "Full school access", "FINANCIAL", true);
        seedRole("PRINCIPAL", "School academic head", "HR_RESTRICTED", true);
        Role accountant = seedRole("ACCOUNTANT", "Fee and accounts only", "FINANCIAL", false);
        grant(accountant, List.of("fees", "dashboard", "students", "school", "audit"), List.of("view", "create", "edit", "approve", "export"));
        Role classTeacher = seedRole("CLASS_TEACHER", "Assigned section students", "NORMAL", false);
        grant(classTeacher, List.of("students", "classes", "subjects", "dashboard"), List.of("view", "edit"));
        Role subjectTeacher = seedRole("SUBJECT_TEACHER", "Assigned subjects only", "NORMAL", false);
        grant(subjectTeacher, List.of("students", "subjects", "classes", "dashboard"), List.of("view"));

        School school = seedSchool();
        seedYear(school);

        seedDemoUser("accountant", "accountant@school.local", "Accountant User", "Accountant@123", accountant, school.getId(), "SCHOOL");
        seedDemoUser("teacher", "teacher@school.local", "Class Teacher", "Teacher@123", classTeacher, null, null);
        seedTeacherStaff();

        if (userRepository.findByUsername("admin").isEmpty()) {
            AppUser admin = new AppUser();
            admin.setUsername("admin");
            admin.setEmail("admin@school.local");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setFullName("System Administrator");
            admin.setStatus("ACTIVE");
            admin.setRoles(Set.of(adminRole));
            UserScope scope = new UserScope();
            scope.setUser(admin);
            scope.setScopeType("SCHOOL");
            scope.setScopeId(school.getId());
            admin.getScopes().add(scope);
            userRepository.save(admin);
            log.info("Created demo admin user. Login with username=admin password=Admin@123");
        }
    }

    private void seedPermissions() {
        for (String module : MODULES) {
            for (String action : ACTIONS) {
                permissionRepository.findByModuleNameAndActionName(module, action).orElseGet(() -> {
                    Permission p = new Permission();
                    p.setModuleName(module);
                    p.setActionName(action);
                    p.setDescription(module + " " + action);
                    p.setSensitivity("fees".equals(module) ? "FINANCIAL" : "staff".equals(module) ? "HR_RESTRICTED" : "NORMAL");
                    return permissionRepository.save(p);
                });
            }
        }
    }

    private Role seedRole(String name, String description, String sensitivity, boolean allPermissions) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            role.setSensitivity(sensitivity);
            if (allPermissions) {
                role.setPermissions(new HashSet<>(permissionRepository.findAll()));
            }
            return roleRepository.save(role);
        });
    }

    private void grant(Role role, List<String> modules, List<String> actions) {
        if (!role.getPermissions().isEmpty()) {
            return;
        }
        Set<Permission> set = new HashSet<>();
        for (Permission p : permissionRepository.findAll()) {
            if (modules.contains(p.getModuleName()) && actions.contains(p.getActionName())) {
                set.add(p);
            }
        }
        role.setPermissions(set);
        roleRepository.save(role);
    }

    private void seedDemoUser(String username, String email, String fullName, String password, Role role,
                              Long scopeId, String scopeType) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setStatus("ACTIVE");
        user.setRoles(Set.of(role));
        if (scopeType != null && scopeId != null) {
            UserScope scope = new UserScope();
            scope.setUser(user);
            scope.setScopeType(scopeType);
            scope.setScopeId(scopeId);
            user.getScopes().add(scope);
        }
        userRepository.save(user);
        log.info("Created demo user {} / {}", username, password);
    }

    private void seedTeacherStaff() {
        AppUser teacher = userRepository.findByUsername("teacher").orElse(null);
        if (teacher == null || staffRepository.findByUserId(teacher.getId()).isPresent()) {
            return;
        }
        Staff staff = new Staff();
        staff.setUserId(teacher.getId());
        staff.setEmployeeId("EMP-T001");
        staff.setFullName(teacher.getFullName());
        staff.setDesignation("Class Teacher");
        staff.setEmail(teacher.getEmail());
        staff.setStatus("ACTIVE");
        staffRepository.save(staff);
        log.info("Linked demo teacher user to staff EMP-T001");
    }

    private School seedSchool() {
        return schoolRepository.findAll().stream().findFirst().orElseGet(() -> {
            School school = new School();
            school.setName("Demo Public School");
            school.setCode("DPS001");
            school.setAddress("1 Education Road");
            school.setPhone("0000000000");
            school.setEmail("office@school.local");
            return schoolRepository.save(school);
        });
    }

    private void seedYear(School school) {
        if (academicYearRepository.findBySchoolId(school.getId()).isEmpty()) {
            AcademicYear year = new AcademicYear();
            year.setSchoolId(school.getId());
            year.setName("2026-2027");
            year.setStartDate(LocalDate.of(2026, 4, 1));
            year.setEndDate(LocalDate.of(2027, 3, 31));
            year.setCurrentYear(true);
            academicYearRepository.save(year);
        }
    }
}
