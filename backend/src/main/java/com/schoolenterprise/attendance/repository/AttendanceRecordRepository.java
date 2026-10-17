package com.schoolenterprise.attendance.repository;

import com.schoolenterprise.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySectionIdAndAttendanceDate(Long sectionId, LocalDate attendanceDate);
    Optional<AttendanceRecord> findByStudentIdAndAttendanceDate(Long studentId, LocalDate attendanceDate);

    @Query("""
            select record.status, count(record)
            from AttendanceRecord record
            where record.sectionId = :sectionId
              and record.attendanceDate between :fromDate and :toDate
            group by record.status
            """)
    List<Object[]> summarizeBySectionAndDateRange(@Param("sectionId") Long sectionId,
                                                   @Param("fromDate") LocalDate fromDate,
                                                   @Param("toDate") LocalDate toDate);
}
