package com.schoolenterprise.academics.service;

import com.schoolenterprise.academics.entity.Department;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.repository.DepartmentRepository;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.audit.service.AuditService;
import com.schoolenterprise.common.security.PermissionService;
import com.schoolenterprise.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicsService {

    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final SchoolService schoolService;
    private final AuditService auditService;
    private final PermissionService permissionService;

    public List<Department> departments() {
        return departmentRepository.findAll();
    }

    public Department saveDepartment(Department d) {
        if (d.getSchoolId() == null) {
            d.setSchoolId(schoolService.getSchool().getId());
        }
        Department saved = departmentRepository.save(d);
        auditService.record("classes", "edit", "Department", saved.getId(), saved.getName());
        return saved;
    }

    public List<Subject> subjects() {
        List<Subject> all = subjectRepository.findAll();
        if (permissionService.hasSchoolWideAccess()) {
            return all;
        }
        return all.stream().filter(s -> permissionService.allowedSubjectIds().contains(s.getId())).toList();
    }

    public Subject saveSubject(Subject s) {
        if (s.getSchoolId() == null) {
            s.setSchoolId(schoolService.getSchool().getId());
        }
        Subject saved = subjectRepository.save(s);
        auditService.record("subjects", "edit", "Subject", saved.getId(), saved.getName());
        return saved;
    }

    public List<SchoolClass> classes() {
        return classRepository.findAll();
    }

    public SchoolClass saveClass(SchoolClass c) {
        if (c.getSchoolId() == null) {
            c.setSchoolId(schoolService.getSchool().getId());
        }
        SchoolClass saved = classRepository.save(c);
        auditService.record("classes", "edit", "SchoolClass", saved.getId(), saved.getName());
        return saved;
    }

    public List<Section> sections() {
        List<Section> all = sectionRepository.findAll();
        if (permissionService.hasSchoolWideAccess()) {
            return all;
        }
        return all.stream().filter(s -> permissionService.allowedSectionIds().contains(s.getId())
                || permissionService.allowedClassIds().contains(s.getClassId())).toList();
    }

    public Section saveSection(Section s) {
        Section saved = sectionRepository.save(s);
        auditService.record("classes", "edit", "Section", saved.getId(), saved.getName());
        return saved;
    }
}
