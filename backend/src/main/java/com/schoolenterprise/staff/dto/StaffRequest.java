package com.schoolenterprise.staff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffRequest {
    @NotBlank @Size(max = 40)
    private String employeeId;
    @NotBlank @Size(max = 150)
    private String fullName;
    @NotBlank @Size(max = 80)
    private String designation;
    @NotNull
    private Long departmentId;
    @NotBlank @Email @Size(max = 120)
    private String email;
    @Size(max = 30)
    private String phone;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";
}
