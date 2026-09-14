-- Stage 1 master data, identity, academics, students, staff, finance, audit.

CREATE TABLE school (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(120),
    website VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE campus (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255),
    CONSTRAINT fk_campus_school FOREIGN KEY (school_id) REFERENCES school(id)
);

CREATE TABLE academic_year (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_year_school FOREIGN KEY (school_id) REFERENCES school(id)
);

CREATE TABLE term (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_year_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT fk_term_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE app_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    reset_token VARCHAR(80),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    sensitivity VARCHAR(30) NOT NULL DEFAULT 'NORMAL'
);

CREATE TABLE permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module_name VARCHAR(50) NOT NULL,
    action_name VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    sensitivity VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    UNIQUE KEY uk_perm (module_name, action_name)
);

CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES role(id)
);

CREATE TABLE role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES role(id),
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permission(id)
);

CREATE TABLE user_scope (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    scope_type VARCHAR(30) NOT NULL,
    scope_id BIGINT NOT NULL,
    CONSTRAINT fk_scope_user FOREIGN KEY (user_id) REFERENCES app_user(id)
);

CREATE TABLE department (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(30) NOT NULL,
    CONSTRAINT fk_dept_school FOREIGN KEY (school_id) REFERENCES school(id)
);

CREATE TABLE subject (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    department_id BIGINT,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(30) NOT NULL,
    CONSTRAINT fk_subject_school FOREIGN KEY (school_id) REFERENCES school(id),
    CONSTRAINT fk_subject_dept FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE school_class (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    grade_level INT,
    CONSTRAINT fk_class_school FOREIGN KEY (school_id) REFERENCES school(id)
);

CREATE TABLE staff (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    employee_id VARCHAR(40) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(80),
    department_id BIGINT,
    phone VARCHAR(30),
    email VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_staff_dept FOREIGN KEY (department_id) REFERENCES department(id)
);

CREATE TABLE section (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    class_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    name VARCHAR(20) NOT NULL,
    class_teacher_staff_id BIGINT,
    CONSTRAINT fk_section_class FOREIGN KEY (class_id) REFERENCES school_class(id),
    CONSTRAINT fk_section_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id),
    CONSTRAINT fk_section_teacher FOREIGN KEY (class_teacher_staff_id) REFERENCES staff(id)
);

CREATE TABLE teacher_assignment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    staff_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT,
    academic_year_id BIGINT NOT NULL,
    CONSTRAINT fk_ta_staff FOREIGN KEY (staff_id) REFERENCES staff(id),
    CONSTRAINT fk_ta_subject FOREIGN KEY (subject_id) REFERENCES subject(id),
    CONSTRAINT fk_ta_class FOREIGN KEY (class_id) REFERENCES school_class(id),
    CONSTRAINT fk_ta_section FOREIGN KEY (section_id) REFERENCES section(id),
    CONSTRAINT fk_ta_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE student (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_number VARCHAR(40) NOT NULL UNIQUE,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_section_id BIGINT,
    phone VARCHAR(30),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_section FOREIGN KEY (current_section_id) REFERENCES section(id)
);

CREATE TABLE guardian (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    relation_type VARCHAR(40) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(120),
    address VARCHAR(255)
);

CREATE TABLE student_guardian (
    student_id BIGINT NOT NULL,
    guardian_id BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (student_id, guardian_id),
    CONSTRAINT fk_sg_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_sg_guardian FOREIGN KEY (guardian_id) REFERENCES guardian(id)
);

CREATE TABLE enrollment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
    enrolled_on DATE NOT NULL,
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_enroll_section FOREIGN KEY (section_id) REFERENCES section(id),
    CONSTRAINT fk_enroll_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE class_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT,
    academic_year_id BIGINT NOT NULL,
    result_status VARCHAR(30),
    CONSTRAINT fk_ch_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_ch_class FOREIGN KEY (class_id) REFERENCES school_class(id),
    CONSTRAINT fk_ch_section FOREIGN KEY (section_id) REFERENCES section(id),
    CONSTRAINT fk_ch_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE student_document (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(150) NOT NULL,
    file_url VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_student FOREIGN KEY (student_id) REFERENCES student(id)
);

CREATE TABLE fee_head (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT fk_fh_school FOREIGN KEY (school_id) REFERENCES school(id)
);

CREATE TABLE fee_structure (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    academic_year_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
    name VARCHAR(120) NOT NULL,
    CONSTRAINT fk_fs_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id),
    CONSTRAINT fk_fs_class FOREIGN KEY (class_id) REFERENCES school_class(id)
);

CREATE TABLE fee_structure_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fee_structure_id BIGINT NOT NULL,
    fee_head_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_fsi_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id),
    CONSTRAINT fk_fsi_head FOREIGN KEY (fee_head_id) REFERENCES fee_head(id)
);

CREATE TABLE student_fee_account (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    total_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    concession_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    outstanding DECIMAL(12,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sfa (student_id, academic_year_id),
    CONSTRAINT fk_sfa_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_sfa_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE invoice (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    invoice_number VARCHAR(40) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_inv_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE invoice_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    fee_head_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id),
    CONSTRAINT fk_ii_head FOREIGN KEY (fee_head_id) REFERENCES fee_head(id)
);

CREATE TABLE payment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(30) NOT NULL,
    paid_on DATE NOT NULL,
    reference_no VARCHAR(80),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id)
);

CREATE TABLE receipt (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_id BIGINT NOT NULL UNIQUE,
    receipt_number VARCHAR(40) NOT NULL UNIQUE,
    issued_on DATE NOT NULL,
    CONSTRAINT fk_rcp_payment FOREIGN KEY (payment_id) REFERENCES payment(id)
);

CREATE TABLE concession (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255),
    approved_by BIGINT,
    CONSTRAINT fk_con_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_con_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(id)
);

CREATE TABLE refund (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255),
    refunded_on DATE NOT NULL,
    CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES payment(id)
);

CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    module_name VARCHAR(50) NOT NULL,
    action_name VARCHAR(50) NOT NULL,
    entity_name VARCHAR(80),
    entity_id BIGINT,
    details VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE login_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_id VARCHAR(80) NOT NULL UNIQUE,
    ip_address VARCHAR(60),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES app_user(id)
);
