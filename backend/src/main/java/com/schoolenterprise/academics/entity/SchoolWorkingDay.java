package com.schoolenterprise.academics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "school_working_day", uniqueConstraints = {
        @UniqueConstraint(name = "uk_school_working_day", columnNames = {"school_id", "day_of_week"}),
        @UniqueConstraint(name = "uk_school_working_day_order", columnNames = {"school_id", "display_order"})
})
@Getter
@Setter
@NoArgsConstructor
public class SchoolWorkingDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "day_of_week", nullable = false, length = 20)
    private String dayOfWeek;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
