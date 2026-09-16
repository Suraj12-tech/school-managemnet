package com.schoolenterprise.staff.dto;

import com.schoolenterprise.staff.entity.Staff;
import lombok.Getter;

@Getter
public class StaffResponse {
    private final Long id;
    private final String employeeId;
    private final String fullName;
    private final String designation;
    private final Long departmentId;
    private final String departmentName;
    private final String email;
    private final String phone;
    private final String status;

    public StaffResponse(Staff staff, String departmentName) {
        id = staff.getId();
        employeeId = staff.getEmployeeId();
        fullName = staff.getFullName();
        designation = staff.getDesignation();
        departmentId = staff.getDepartmentId();
        this.departmentName = departmentName;
        email = staff.getEmail();
        phone = staff.getPhone();
        status = staff.getStatus();
    }

    protected StaffResponse(StaffResponse source) {
        id = source.id;
        employeeId = source.employeeId;
        fullName = source.fullName;
        designation = source.designation;
        departmentId = source.departmentId;
        departmentName = source.departmentName;
        email = source.email;
        phone = source.phone;
        status = source.status;
    }
}
