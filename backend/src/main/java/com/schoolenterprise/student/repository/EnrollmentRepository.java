package com.schoolenterprise.student.repository;

import com.schoolenterprise.student.entity.Enrollment;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findBySectionId(Long sectionId);
    List<Enrollment> findBySectionIdAndAcademicYearId(Long sectionId, Long academicYearId);
    List<Enrollment> findByAcademicYearId(Long academicYearId);
    @Query("""
            select e from Enrollment e, Section s, Student st
            where e.sectionId = s.id
              and e.studentId = st.id
              and e.academicYearId = :academicYearId
              and s.academicYearId = :academicYearId
              and s.classId = :classId
              and upper(s.status) = 'ACTIVE'
              and st.currentSectionId = e.sectionId
              and (st.status is null or upper(st.status) not in ('LEFT', 'TRANSFERRED'))
              and upper(e.status) = 'ENROLLED'
            """)
    List<Enrollment> findCurrentEnrollmentsForPromotion(
            @Param("academicYearId") Long academicYearId,
            @Param("classId") Long classId);
    boolean existsByStudentIdAndAcademicYearId(Long studentId, Long academicYearId);
}
