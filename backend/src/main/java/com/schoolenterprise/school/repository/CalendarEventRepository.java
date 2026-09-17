package com.schoolenterprise.school.repository;

import com.schoolenterprise.school.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByAcademicYearId(Long academicYearId);
    List<CalendarEvent> findByAcademicYearIdOrderByStartDateAsc(Long academicYearId);
    List<CalendarEvent> findByAcademicYearIdAndEventTypeOrderByStartDateAsc(Long academicYearId, String eventType);
}
