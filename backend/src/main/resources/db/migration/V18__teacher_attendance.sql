CREATE TABLE attendance_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_status VARCHAR(20) NOT NULL,
    marked_by_staff_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_attendance_section FOREIGN KEY (section_id) REFERENCES section(id),
    CONSTRAINT fk_attendance_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id),
    CONSTRAINT fk_attendance_staff FOREIGN KEY (marked_by_staff_id) REFERENCES staff(id),
    CONSTRAINT uk_attendance_student_date UNIQUE (student_id, attendance_date),
    INDEX ix_attendance_section_date (section_id, attendance_date)
);
