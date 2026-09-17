package com.schoolenterprise.school.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "calendar_event")
public class CalendarEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    private String title;
    @Column(name = "event_type")
    private String eventType;
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    private String description;
    private String status = "ACTIVE";
}
