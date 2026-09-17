CREATE TABLE calendar_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_year_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_calendar_event_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

