CREATE TABLE assessment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NULL,
    subject_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    assessment_date DATE NOT NULL,
    max_marks DECIMAL(8,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_class FOREIGN KEY (class_id) REFERENCES school_class(id),
    CONSTRAINT fk_assessment_section FOREIGN KEY (section_id) REFERENCES section(id),
    CONSTRAINT fk_assessment_subject FOREIGN KEY (subject_id) REFERENCES subject(id),
    CONSTRAINT fk_assessment_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id),
    INDEX ix_assessment_status_date (status, assessment_date),
    INDEX ix_assessment_scope (class_id, section_id, subject_id, academic_year_id)
);
