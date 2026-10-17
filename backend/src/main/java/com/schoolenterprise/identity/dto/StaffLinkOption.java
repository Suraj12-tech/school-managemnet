package com.schoolenterprise.identity.dto;

import com.schoolenterprise.staff.entity.Staff;

public record StaffLinkOption(
        Long id,
        String employeeId,
        String fullName,
        String status,
        String staffCategory,
        Long linkedUserId
) {
    public StaffLinkOption(Staff staff) {
        this(staff.getId(), staff.getEmployeeId(), staff.getFullName(), staff.getStatus(),
                staff.getStaffCategory(), staff.getUserId());
    }
}
