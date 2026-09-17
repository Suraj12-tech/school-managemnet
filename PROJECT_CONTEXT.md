# School Enterprise — Project Context

Use this file as the handoff document when continuing work. Update it whenever architecture, scope, or remaining work changes.

## Goal

Stage 1 of the School Enterprise platform: **core administration and finance**. Source spec: `School_Enterprise_Stage_1_Core_Administration_and_Finance.docx` (desktop / download copy).

This stage owns school setup, users/roles/permissions, students, staff, classes, fees, the admin dashboard, and audit. Later stages (attendance, exams, LMS, etc.) are out of scope.

## Architecture

Modular monolith. One Spring Boot app; each feature lives in its own package with the same three layers:

`controller` (HTTP) → `service` (business rules) → `repository` (database)

```
school-enterprise/
  backend/     Java 21 + Spring Boot 3.3 (port 8080)
  frontend/    React + JavaScript + Vite (port 5173)
  postman/     API collection
```

Packages under `com.schoolenterprise`:

| Package | Owns |
| --- | --- |
| `auth` | Login, logout, password reset, `LoginSession` |
| `school` | School, campus, academic year, term |
| `identity` | Users, roles, permissions, assignment scopes |
| `academics` | Class, section, subject, department |
| `student` | Students, guardians, enrollment, documents metadata, class history |
| `staff` | Staff profiles, teacher assignments |
| `finance` | Fee heads/structures, invoices, payments, receipts, concessions, refunds |
| `dashboard` | Counts and alerts |
| `audit` | Audit log |
| `common` | JWT, permission interceptor, errors |

**Authorization is server-side.** `@RequirePermission` on controllers is enforced by `PermissionInterceptor`. Hiding a menu item is not security.

Outstanding fees: `outstanding = max(0, totalDue - totalPaid - concessionAmount)` in `FeeCalculator`.

Default demo login: `admin` / `Admin@123`

## Important decisions

- Modular monolith, not microservices.
- MySQL + Flyway for real runs; H2 (`ddl-auto=create-drop`, Flyway off) for automated tests.
- JWT stored in `login_session`; logout revokes `token_id`.
- Role **sensitivity** (`NORMAL`, `FINANCIAL`, `HR_RESTRICTED`) is a second gate: fee APIs require a FINANCIAL (or ADMIN) role, even if a NORMAL role is given `fees:*` by mistake.
- Record **scope** (`SCHOOL`, `CAMPUS`, `CLASS`, `SECTION`, `SUBJECT`) filters students/subjects/sections.
- **Time scope**: users without historical access only see the current academic year’s fee accounts.
- Class teacher vs accountant: fee access is never implied by teaching assignment.
- React is JavaScript (no TypeScript) per original stack choice.

## Completed work

- Flyway schema for every Stage 1 entity listed in the spec.
- Auth APIs + session revoke + password reset with single-use, expiring tokens delivered through SMTP email.
- School, campus, year, term, class, section, subject, department APIs and screens.
- Users, roles, permission matrix, assignment scopes (API + UI).
- Students, guardians, enrollment, document metadata, class history.
- Staff list/profile, teacher assignments, class-teacher mapping.
- Fee heads, structures by year/class/category, invoices, payments, receipts, concessions, refunds, dues/collection reports.
- Admin dashboard counts/alerts and audit log.
- Backend permission + section-scope checks; financial sensitivity gate; current-year fee default.
- JUnit tests for fee math, permission rules, login validation, and Stage 1 API acceptance (authn/authz/outstanding).
- Postman collection and Docker Compose MySQL for independent staging.

## Pending work (not Stage 1 / follow-ups)

- Configure SMTP credentials through environment variables before using password reset email delivery.
- Binary file storage for student documents (Stage 1 is metadata only).
- Multi-school tenancy beyond a single seeded school.
- Stages after 1: attendance, timetable, exams, report cards, communication, etc.
- Production secrets management (local database and SMTP credentials stay in ignored properties/environment variables).

## How to continue

1. Read this file, then `README.md`.
2. Treat the Stage 1 docx as the acceptance source; do not invent later-stage modules here.
3. Keep packages independent: do not leak finance rules into `student` except through APIs/services you already inject.
4. Add tests next to the behavior you change (`backend/src/test/java`).
5. After a meaningful slice, update **Completed work**, **Pending work**, and **Important decisions** in this file.
6. Run `cd backend && mvn test` before calling a slice done. For UI, run frontend + backend and click the changed screens.

## Local run

```bash
# MySQL (optional Docker)
docker compose up -d

cd backend && mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
cd frontend && npm install && npm run dev
```

Swagger: http://localhost:8080/swagger-ui.html
UI: http://localhost:5173
