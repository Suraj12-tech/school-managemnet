package com.schoolenterprise.staff.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "staff")
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "employee_id")
    private String employeeId;
    @Column(name = "full_name")
    private String fullName;
    private String designation;
    @Column(name = "department_id")
    private Long departmentId;
    private String phone;
    private String email;
    private String status = "ACTIVE";
}
