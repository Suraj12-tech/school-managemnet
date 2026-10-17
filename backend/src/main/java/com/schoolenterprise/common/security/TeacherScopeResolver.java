package com.schoolenterprise.common.security;

import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Subject;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.academics.repository.SubjectClassMappingRepository;
import com.schoolenterprise.academics.repository.SubjectRepository;
import com.schoolenterprise.common.exception.AppException;
import com.schoolenterprise.school.entity.AcademicYear;
import com.schoolenterprise.school.repository.AcademicYearRepository;
import com.schoolenterprise.staff.entity.Staff;
import com.schoolenterprise.staff.entity.TeacherAssignment;
import com.schoolenterprise.staff.repository.StaffRepository;
import com.schoolenterprise.staff.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeacherScopeResolver {

    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository assignmentRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final SubjectClassMappingRepository subjectClassMappingRepository;
    private final AcademicYearRepository academicYearRepository;

    @Transactional(readOnly = true)
    public TeacherScope resolve(AppUserDetails user) {
        if (!user.isEnabled()) {
            throw AppException.unauthorized("Please login");
        }
        List<Staff> linkedStaff = staffRepository.findAllByUserId(user.getUserId());
        if (linkedStaff.size() != 1) {
            throw AppException.forbidden("Teacher account is not linked to exactly one eligible Staff record");
        }
        Staff staff = linkedStaff.get(0);
        if (!"ACTIVE".equals(staff.getStatus()) || !"TEACHING".equals(staff.getStaffCategory())) {
            throw AppException.forbidden("Teacher account is not linked to eligible Staff");
        }

        Set<Long> classIds = new HashSet<>();
        Set<Long> sectionIds = new HashSet<>();
        Set<Long> subjectIds = new HashSet<>();
        Set<Long> yearIds = new HashSet<>();
        Set<Long> assignmentIds = new HashSet<>();

        for (TeacherAssignment assignment : assignmentRepository.findByStaffId(staff.getId())) {
            if (!"ACTIVE".equals(assignment.getStatus()) || assignment.getId() == null) {
                continue;
            }
            addIfValid(staff.getId(), assignment, assignmentIds, classIds, sectionIds, subjectIds, yearIds);
        }

        return new TeacherScope(staff.getId(), Set.copyOf(assignmentIds), Set.copyOf(classIds), Set.copyOf(sectionIds),
                Set.copyOf(subjectIds), Set.copyOf(yearIds));
    }

    private void addIfValid(Long staffId, TeacherAssignment assignment, Set<Long> assignmentIds,
                            Set<Long> classIds, Set<Long> sectionIds,
                            Set<Long> subjectIds, Set<Long> yearIds) {
        if (assignment.getClassId() == null || assignment.getAcademicYearId() == null) {
            return;
        }
        SchoolClass schoolClass = classRepository.findById(assignment.getClassId()).orElse(null);
        AcademicYear year = academicYearRepository.findById(assignment.getAcademicYearId()).orElse(null);
        if (schoolClass == null || year == null || !"ACTIVE".equals(year.getStatus())
                || schoolClass.getSchoolId() == null || !schoolClass.getSchoolId().equals(year.getSchoolId())) {
            return;
        }

        Section section = null;
        if (assignment.getSectionId() != null) {
            section = sectionRepository.findById(assignment.getSectionId()).orElse(null);
            if (section == null || !"ACTIVE".equals(section.getStatus())
                    || !assignment.getClassId().equals(section.getClassId())
                    || !assignment.getAcademicYearId().equals(section.getAcademicYearId())) {
                return;
            }
        }

        String assignmentType = assignment.getAssignmentType();
        Subject subject = null;
        if (assignment.getSubjectId() != null) {
            subject = subjectRepository.findById(assignment.getSubjectId()).orElse(null);
            if (subject == null || !"ACTIVE".equals(subject.getStatus())
                    || !schoolClass.getSchoolId().equals(subject.getSchoolId())) {
                return;
            }
        }

        if ("CLASS_TEACHER".equals(assignmentType)) {
            if (section == null || subject != null || !staffId.equals(section.getClassTeacherStaffId())) {
                return;
            }
            sectionIds.add(section.getId());
        } else if ("SUBJECT_TEACHER".equals(assignmentType)) {
            if (subject == null || !subjectClassMappingRepository.existsBySubjectIdAndClassIdAndAcademicYearId(
                    subject.getId(), schoolClass.getId(), year.getId())) {
                return;
            }
            subjectIds.add(subject.getId());
            if (section == null) {
                sectionRepository.findByClassIdAndAcademicYearId(schoolClass.getId(), year.getId()).stream()
                        .filter(assignedSection -> "ACTIVE".equals(assignedSection.getStatus()))
                        .map(Section::getId)
                        .forEach(sectionIds::add);
            }
        } else {
            return;
        }

        classIds.add(schoolClass.getId());
        yearIds.add(year.getId());
        if (section != null) {
            sectionIds.add(section.getId());
        }
        if (subject != null) {
            subjectIds.add(subject.getId());
        }
        assignmentIds.add(assignment.getId());
    }
}
