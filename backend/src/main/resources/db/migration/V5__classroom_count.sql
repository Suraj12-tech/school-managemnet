ALTER TABLE school_class ADD COLUMN number_of_classrooms INT NOT NULL DEFAULT 1;
ALTER TABLE school_class DROP COLUMN grade_level;
