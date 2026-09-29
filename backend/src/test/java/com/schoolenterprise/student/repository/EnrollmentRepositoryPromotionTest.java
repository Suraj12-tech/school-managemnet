package com.schoolenterprise.student.repository;

import com.schoolenterprise.academics.entity.SchoolClass;
import com.schoolenterprise.academics.entity.Section;
import com.schoolenterprise.academics.repository.SchoolClassRepository;
import com.schoolenterprise.academics.repository.SectionRepository;
import com.schoolenterprise.student.entity.Enrollment;
import com.schoolenterprise.student.entity.Student;
import com.schoolenterprise.student.repository.EnrollmentRepository;
import com.schoolenterprise.student.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:promotion-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.flyway.enabled=false"
})
class EnrollmentRepositoryPromotionTest {
    private static final Long SOURCE_YEAR_ID = 2026L;

    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private SchoolClassRepository schoolClassRepository;
    @Autowired private SectionRepository sectionRepository;

    @Test
    void promotionQueryReturnsOnlyCurrentEnrolledStudentsFromEligibleClass() {
        Section class6Section = sectionFor("Class 6", "A", "ACTIVE");
        Section class1Section = sectionFor("Class 1", "A", "ACTIVE");
        Section class10Section = sectionFor("Class 10", "A", "ACTIVE");
        Section otherClass6Section = createSection(class6Section.getClassId(), "B", "ACTIVE");

        Enrollment eligible = enrollmentFor(studentIn(class6Section, "ACTIVE"), class6Section, "ENROLLED");
        enrollmentFor(studentIn(class1Section, "ACTIVE"), class1Section, "ENROLLED");
        enrollmentFor(studentIn(class10Section, "ACTIVE"), class10Section, "ENROLLED");
        enrollmentFor(studentIn(class6Section, "TRANSFERRED"), class6Section, "ENROLLED");
        Student noLongerInSourceSection = studentIn(otherClass6Section, "ACTIVE");
        noLongerInSourceSection.setCurrentSectionId(otherClass6Section.getId());
        studentRepository.saveAndFlush(noLongerInSourceSection);
        enrollmentFor(noLongerInSourceSection, class6Section, "ENROLLED");
        enrollmentFor(studentIn(class6Section, "ACTIVE"), class6Section, "LEFT");

        List<Enrollment> results = enrollmentRepository.findCurrentEnrollmentsForPromotion(
                SOURCE_YEAR_ID, class6Section.getClassId());

        assertEquals(List.of(eligible.getId()), results.stream().map(Enrollment::getId).toList());
    }

    private Section sectionFor(String className, String sectionName, String status) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setSchoolId(1L);
        schoolClass.setName(className);
        schoolClass.setNumberOfClassrooms(1);
        schoolClass = schoolClassRepository.saveAndFlush(schoolClass);

        return createSection(schoolClass.getId(), sectionName, status);
    }

    private Section createSection(Long classId, String sectionName, String status) {
        Section section = new Section();
        section.setClassId(classId);
        section.setAcademicYearId(SOURCE_YEAR_ID);
        section.setName(sectionName);
        section.setStatus(status);
        return sectionRepository.saveAndFlush(section);
    }

    private Student studentIn(Section section, String status) {
        Student student = new Student();
        student.setAdmissionNumber("ADM-" + System.nanoTime());
        student.setFirstName("Test");
        student.setLastName("Student");
        student.setStatus(status);
        student.setCurrentSectionId(section.getId());
        return studentRepository.saveAndFlush(student);
    }

    private Enrollment enrollmentFor(Student student, Section section, String status) {
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(student.getId());
        enrollment.setSectionId(section.getId());
        enrollment.setAcademicYearId(SOURCE_YEAR_ID);
        enrollment.setStatus(status);
        return enrollmentRepository.saveAndFlush(enrollment);
    }
}
