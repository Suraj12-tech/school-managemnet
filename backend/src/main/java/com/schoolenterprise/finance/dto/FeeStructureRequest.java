package com.schoolenterprise.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FeeStructureRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String category;
    @NotNull
    private Long academicYearId;
    @NotNull
    private Long classId;
    @NotEmpty
    @Valid
    private List<FeeStructureItemRequest> items;
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "status must be ACTIVE or INACTIVE")
    private String status = "ACTIVE";
}
