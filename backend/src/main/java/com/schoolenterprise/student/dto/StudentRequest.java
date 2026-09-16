package com.schoolenterprise.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StudentRequest {
    @NotBlank(message = "admissionNumber is required")
    @Size(max = 40, message = "admissionNumber must be at most 40 characters")
    private String admissionNumber;
    @NotBlank(message = "firstName is required")
    @Size(max = 80, message = "firstName must be at most 80 characters")
    private String firstName;
    @NotBlank(message = "lastName is required")
    @Size(max = 80, message = "lastName must be at most 80 characters")
    private String lastName;
    @PastOrPresent(message = "dateOfBirth cannot be in the future")
    private LocalDate dateOfBirth;
    private String gender;
    @Email(message = "email must be valid")
    @Size(max = 120, message = "email must be at most 120 characters")
    private String email;
    @Size(max = 30, message = "phone must be at most 30 characters")
    private String phone;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status;
    @Positive
    private Long academicYearId;
    @Positive
    private Long classId;
    @Positive
    private Long sectionId;
}
