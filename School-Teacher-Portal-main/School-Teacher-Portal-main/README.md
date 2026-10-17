# School Teacher Portal

React + TypeScript frontend for the shared School Enterprise Spring Boot API. The portal exposes a teacher profile, assignment-scoped classes/sections/subjects/academic years, student rosters and profiles, timetable, class-teacher attendance marking, published assessments, and teacher reports. Teachers can update attendance only for their authorized class-teacher sections; assessment views are read-only.

## Local development

1. Start the Spring Boot backend on `http://localhost:8080` with its configured MySQL database.
2. In this directory, run `npm install` if project dependencies are not already installed.
3. Run `npm run dev`. Vite proxies `/api` requests to the backend on port 8080.
4. Sign in with an existing AppUser account that an Admin has linked to an ACTIVE Staff record categorized as TEACHING and assigned the appropriate teacher role.

The teacher portal does not start JSON Server as part of its integrated development command. `db.json` remains demo data and is not imported by the integrated screens.

## Deployment configuration

- Set `VITE_API_URL` at frontend build time to the Spring Boot API origin when the frontend and API are hosted separately. Leave it unset when the frontend is served from the same origin as `/api`.
- Configure the backend environment variable `APP_CORS_ALLOWED_ORIGIN_PATTERNS` with the exact deployed frontend origin(s), comma-separated. Do not use a wildcard for production origins.
- Ensure the backend's Staff Category migration is applied, eligible Staff records are explicitly classified by an Admin, and account-to-Staff links and active assignments have been reviewed before enabling teacher access.

## Authentication note

The portal retains the existing JWT session in `localStorage` for this integration phase. This is vulnerable to token theft if an XSS vulnerability is introduced; use strict output handling and a restrictive Content Security Policy, and plan a later move to secure, HttpOnly cookies.

Attendance, published assessment viewing, and teacher reports are integrated. Exam-mark entry, assignments/submissions, correction requests, and other academic writes remain outside the integrated portal.
