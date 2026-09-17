package com.schoolenterprise.school.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.Campus;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.entity.Term;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.repository.CampusRepository;
import com.schoolenterprise.school.repository.SchoolRepository;
import com.schoolenterprise.school.repository.TermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolService {

    private final SchoolRepository schoolRepository;
    private final CampusRepository campusRepository;
    private final AcademicYearRepository academicYearRepository;
    private final TermRepository termRepository;
    private final AuditService auditService;

    public School getSchool() {
        return schoolRepository.findAll().stream().findFirst()
                .orElseThrow(() -> AppException.notFound("School is not set up yet"));
    }

    @Transactional
    public School saveSchool(School incoming) {
        School school = schoolRepository.findAll().stream().findFirst().orElse(new School());
        school.setName(incoming.getName());
        school.setCode(incoming.getCode());
        school.setAddress(incoming.getAddress());
        school.setPhone(incoming.getPhone());
        school.setEmail(incoming.getEmail());
        school.setWebsite(incoming.getWebsite());
        School saved = schoolRepository.save(school);
        auditService.record("school", "edit", "School", saved.getId(), saved.getName());
        return saved;
    }

    public List<Campus> campuses() {
        return campusRepository.findAll();
    }

    public Campus saveCampus(Campus campus) {
        if (campus.getSchoolId() == null) {
            campus.setSchoolId(getSchool().getId());
        }
        Campus saved = campusRepository.save(campus);
        auditService.record("school", "edit", "Campus", saved.getId(), saved.getName());
        return saved;
    }

    public List<AcademicYear> years() {
        return academicYearRepository.findAll();
    }

    @Transactional
    public AcademicYear saveYear(AcademicYear year) {
        if (year.getSchoolId() == null) {
            year.setSchoolId(getSchool().getId());
        }
        AcademicYear saved = academicYearRepository.save(year);
        auditService.record("school", "edit", "AcademicYear", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public AcademicYear setCurrentYear(Long id) {
        AcademicYear chosen = academicYearRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        for (AcademicYear year : academicYearRepository.findBySchoolId(chosen.getSchoolId())) {
            year.setCurrentYear(year.getId().equals(id));
            academicYearRepository.save(year);
        }
        auditService.record("school", "edit", "AcademicYear", id, "Set current");
        return chosen;
    }

    public List<Term> terms(Long yearId) {
        if (yearId == null) {
            return termRepository.findAll();
        }
        return termRepository.findByAcademicYearId(yearId);
    }

    public Term saveTerm(Term term) {
        Term saved = termRepository.save(term);
        auditService.record("school", "edit", "Term", saved.getId(), saved.getName());
        return saved;
    }
}
