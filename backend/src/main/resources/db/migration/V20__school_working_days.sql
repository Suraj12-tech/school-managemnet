CREATE TABLE school_working_day (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT fk_school_working_day_school FOREIGN KEY (school_id) REFERENCES school(id),
    CONSTRAINT uk_school_working_day UNIQUE (school_id, day_of_week),
    CONSTRAINT uk_school_working_day_order UNIQUE (school_id, display_order)
);
