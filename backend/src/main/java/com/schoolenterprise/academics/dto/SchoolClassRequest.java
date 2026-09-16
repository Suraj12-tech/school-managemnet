package com.schoolenterprise.academics.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SchoolClassRequest {
    @NotBlank
    @Size(max = 50)
    private String name;

    @NotNull
    @Min(1)
    private Integer numberOfClassrooms = 1;
}
