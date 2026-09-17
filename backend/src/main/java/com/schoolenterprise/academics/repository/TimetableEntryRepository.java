package com.schoolenterprise.academics.repository;

import com.schoolenterprise.academics.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableEntryRepository extends JpaRepository<TimetableEntry, Long> {

    List<TimetableEntry> findBySchoolId(Long schoolId);

    List<TimetableEntry> findBySchoolIdAndAcademicYearId(Long schoolId, Long academicYearId);

    List<TimetableEntry> findBySectionIdAndAcademicYearId(Long sectionId, Long academicYearId);

    List<TimetableEntry> findByClassIdAndAcademicYearId(Long classId, Long academicYearId);

    List<TimetableEntry> findByStaffIdAndAcademicYearId(Long staffId, Long academicYearId);

    List<TimetableEntry> findBySectionId(Long sectionId);

    void deleteBySectionId(Long sectionId);

    void deleteBySubjectId(Long subjectId);
}
