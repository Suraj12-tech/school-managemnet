package com.schoolenterprise.school.service;

import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.entity.Campus;
import com.schoolenterprise.school.entity.School;
import com.schoolenterprise.school.entity.Term;
import com.schoolenterprise.school.dto.AcademicYearRequest;
import com.schoolenterprise.school.dto.TermRequest;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.school.repository.CampusRepository;
import com.schoolenterprise.school.repository.SchoolRepository;
import com.schoolenterprise.school.repository.TermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

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
        return academicYearRepository.findBySchoolId(getSchool().getId());
    }

    @Transactional
    public AcademicYear saveYear(Long id, AcademicYearRequest request) {
        Long schoolId = getSchool().getId();
        AcademicYear year = id == null
                ? new AcademicYear()
                : academicYearRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        if (year.getId() != null && !Objects.equals(year.getSchoolId(), schoolId)) {
            throw AppException.notFound("Academic year not found");
        }
        validateYear(request, schoolId, id);
        year.setSchoolId(schoolId);
        year.setName(request.getName().trim());
        year.setStartDate(request.getStartDate());
        year.setEndDate(request.getEndDate());
        year.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        if ("ARCHIVED".equals(year.getStatus())) {
            year.setCurrentYear(false);
        }
        AcademicYear saved = academicYearRepository.save(year);
        auditService.record("school", "edit", "AcademicYear", saved.getId(), saved.getName());
        return saved;
    }

    public AcademicYear year(Long id) {
        AcademicYear year = academicYearRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Academic year not found"));
        if (!Objects.equals(year.getSchoolId(), getSchool().getId())) {
            throw AppException.notFound("Academic year not found");
        }
        return year;
    }

    @Transactional
    public AcademicYear setCurrentYear(Long id) {
        AcademicYear chosen = year(id);
        if (!"ACTIVE".equals(chosen.getStatus())) {
            throw AppException.badRequest("Archived academic years cannot be current");
        }
        for (AcademicYear year : academicYearRepository.findBySchoolId(chosen.getSchoolId())) {
            year.setCurrentYear(year.getId().equals(id));
            academicYearRepository.save(year);
        }
        auditService.record("school", "edit", "AcademicYear", id, "Set current");
        return chosen;
    }

    @Transactional
    public AcademicYear updateYearStatus(Long id, String status) {
        AcademicYear year = year(id);
        if (!"ACTIVE".equals(status) && !"ARCHIVED".equals(status)) {
            throw AppException.badRequest("Academic year status must be ACTIVE or ARCHIVED");
        }
        if ("ARCHIVED".equals(status)) {
            year.setCurrentYear(false);
        }
        year.setStatus(status);
        AcademicYear saved = academicYearRepository.save(year);
        auditService.record("school", "edit", "AcademicYear", id, status);
        return saved;
    }

    public List<Term> terms(Long yearId) {
        if (yearId == null) {
            return termRepository.findAll();
        }
        year(yearId);
        return termRepository.findByAcademicYearId(yearId);
    }

    public Term term(Long id) {
        return termRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Term not found"));
    }

    @Transactional
    public Term saveTerm(Long id, TermRequest request) {
        AcademicYear year = year(request.getAcademicYearId());
        if (!"ACTIVE".equals(year.getStatus())) {
            throw AppException.badRequest("Terms cannot be changed under an archived academic year");
        }
        validateTerm(request, id, year);
        Term term = id == null ? new Term() : term(id);
        if (term.getId() != null && !Objects.equals(term.getAcademicYearId(), year.getId())) {
            throw AppException.badRequest("Term cannot be moved to another academic year");
        }
        term.setAcademicYearId(year.getId());
        term.setName(request.getName().trim());
        term.setStartDate(request.getStartDate());
        term.setEndDate(request.getEndDate());
        term.setStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());
        Term saved = termRepository.save(term);
        auditService.record("school", "edit", "Term", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public Term updateTermStatus(Long id, String status) {
        Term term = term(id);
        year(term.getAcademicYearId());
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw AppException.badRequest("Term status must be ACTIVE or INACTIVE");
        }
        term.setStatus(status);
        Term saved = termRepository.save(term);
        auditService.record("school", "edit", "Term", id, status);
        return saved;
    }

    @Transactional
    public void deleteTerm(Long id) {
        Term term = term(id);
        year(term.getAcademicYearId());
        termRepository.delete(term);
        auditService.record("school", "delete", "Term", id, term.getName());
    }

    private void validateYear(AcademicYearRequest request, Long schoolId, Long editingId) {
        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw AppException.badRequest("Academic year start date must be before end date");
        }
        boolean duplicateName = academicYearRepository.findBySchoolId(schoolId).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), editingId)
                        && existing.getName().equalsIgnoreCase(request.getName().trim()));
        if (duplicateName) {
            throw AppException.badRequest("Academic year name already exists");
        }
        boolean overlaps = academicYearRepository.findBySchoolId(schoolId).stream()
                .filter(existing -> !Objects.equals(existing.getId(), editingId))
                .anyMatch(existing -> overlaps(request.getStartDate(), request.getEndDate(),
                        existing.getStartDate(), existing.getEndDate()));
        if (overlaps) {
            throw AppException.badRequest("Academic year dates overlap an existing academic year");
        }
    }

    private void validateTerm(TermRequest request, Long editingId, AcademicYear year) {
        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw AppException.badRequest("Term start date must be before end date");
        }
        if (request.getStartDate().isBefore(year.getStartDate())
                || request.getEndDate().isAfter(year.getEndDate())) {
            throw AppException.badRequest("Term dates must fall within the academic year");
        }
        boolean duplicateName = termRepository.findByAcademicYearId(year.getId()).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), editingId)
                        && existing.getName().equalsIgnoreCase(request.getName().trim()));
        if (duplicateName) {
            throw AppException.badRequest("Term name already exists in this academic year");
        }
        boolean overlaps = termRepository.findByAcademicYearId(year.getId()).stream()
                .filter(existing -> !Objects.equals(existing.getId(), editingId))
                .anyMatch(existing -> overlaps(request.getStartDate(), request.getEndDate(),
                        existing.getStartDate(), existing.getEndDate()));
        if (overlaps) {
            throw AppException.badRequest("Term dates overlap an existing term");
        }
    }

    private boolean overlaps(java.time.LocalDate start, java.time.LocalDate end,
                             java.time.LocalDate otherStart, java.time.LocalDate otherEnd) {
        return start.isBefore(otherEnd) && end.isAfter(otherStart);
    }
}
