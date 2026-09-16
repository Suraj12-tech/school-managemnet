ALTER TABLE department
    ADD COLUMN description VARCHAR(255),
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE subject
    ADD COLUMN description VARCHAR(255),
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE subject_class_mapping (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    CONSTRAINT fk_scm_subject FOREIGN KEY (subject_id) REFERENCES subject(id),
    CONSTRAINT fk_scm_class FOREIGN KEY (class_id) REFERENCES school_class(id),
    CONSTRAINT fk_scm_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id),
    CONSTRAINT uk_scm_subject_class_year UNIQUE (subject_id, class_id, academic_year_id)
);
