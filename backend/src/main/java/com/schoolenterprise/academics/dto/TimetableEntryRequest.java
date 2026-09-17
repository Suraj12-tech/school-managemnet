package com.schoolenterprise.academics.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimetableEntryRequest {

    @NotNull(message = "Class is required")
    private Long classId;

    @NotNull(message = "Section is required")
    private Long sectionId;

    @NotNull(message = "Academic year is required")
    private Long academicYearId;

    @NotBlank(message = "Day of week is required")
    private String dayOfWeek;

    @NotNull(message = "Period number is required")
    @Min(value = 1, message = "Period number must be between 1 and 12")
    @Max(value = 12, message = "Period number must be between 1 and 12")
    private Integer periodNumber;

    private String periodName;

    private String startTime;

    private String endTime;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Teacher is required")
    private Long staffId;

    private String room;

    private String status = "ACTIVE";
}
