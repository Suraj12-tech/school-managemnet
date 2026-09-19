# Beginner guide

This project is a school-management application with two separate parts:

- `frontend`: React screens that users interact with.
- `backend`: Spring Boot API that validates permissions and talks to MySQL.

## Frontend request flow

```text
main.jsx
  -> AuthProvider
  -> App
  -> routes/AppRoutes.jsx
  -> pages/SomePage.jsx
  -> api/client.js
  -> backend controller
```

### Where to make a change

| Need | Folder |
| --- | --- |
| Add or change a screen | `frontend/src/pages` |
| Reuse a visual element | `frontend/src/components` |
| Add an API call | `frontend/src/api` |
| Change login/session behavior | `frontend/src/auth` |
| Add or change a URL | `frontend/src/routes/AppRoutes.jsx` |
| Change server business rules | `backend/src/main/java/.../<module>/service` |
| Change database access | `backend/src/main/java/.../<module>/repository` |
| Change an API endpoint | `backend/src/main/java/.../<module>/controller` |
| Change request/response shape | `backend/src/main/java/.../<module>/dto` |

## Backend request flow

Every feature follows the same simple direction:

```text
controller -> service -> repository -> database
```

- **Controller** receives HTTP requests and returns responses.
- **Service** contains business rules and validation.
- **Repository** reads and writes data.
- **Entity** represents a database table.
- **DTO** represents data sent to or received from the frontend.

Do not put business rules in a controller. Do not call a repository directly from
the frontend.

## Authentication

`frontend/src/auth/authStorage.js` is the only place that reads or writes login
data in browser storage. `AuthContext.jsx` keeps the current user in React
state. `api/client.js` automatically adds the JWT token to API requests and
clears the session when the server returns `401`.

## Local development

```text
Backend:  cd backend  && mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
Frontend: cd frontend && npm run dev
```

When adding a feature, first find the existing module with the same pattern,
copy its small parts, and keep the same controller/service/repository flow.
