package com.schoolenterprise.staff.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository assignmentRepository;
    private final AuditService auditService;
    private final PermissionService permissionService;

    public List<Staff> list() {
        return staffRepository.findAll();
    }

    public Staff get(Long id) {
        return staffRepository.findById(id).orElseThrow(() -> AppException.notFound("Staff not found"));
    }

    public Staff save(Staff staff) {
        if (staff.getId() == null && staffRepository.existsByEmployeeId(staff.getEmployeeId())) {
            throw AppException.badRequest("Employee ID already exists");
        }
        if (staff.getStatus() == null) {
            staff.setStatus("ACTIVE");
        }
        Staff saved = staffRepository.save(staff);
        auditService.record("staff", "edit", "Staff", saved.getId(), saved.getEmployeeId());
        return saved;
    }

    public List<TeacherAssignment> assignments() {
        return assignmentRepository.findAll();
    }

    public TeacherAssignment saveAssignment(TeacherAssignment a) {
        permissionService.assertSubject(a.getSubjectId());
        TeacherAssignment saved = assignmentRepository.save(a);
        auditService.record("staff", "edit", "TeacherAssignment", saved.getId(), "Staff " + saved.getStaffId());
        return saved;
    }
}
