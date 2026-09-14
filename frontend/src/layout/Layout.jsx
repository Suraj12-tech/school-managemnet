import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", module: "dashboard" },
  { to: "/school", label: "School Profile", module: "school" },
  { to: "/years", label: "Years & Terms", module: "school" },
  { to: "/classes", label: "Classes & Sections", module: "classes" },
  { to: "/subjects", label: "Subjects & Depts", module: "subjects" },
  { to: "/users", label: "Users", module: "users" },
  { to: "/roles", label: "Roles & Permissions", module: "users" },
  { to: "/students", label: "Students", module: "students" },
  { to: "/guardians", label: "Guardians", module: "students" },
  { to: "/staff", label: "Staff", module: "staff" },
  { to: "/assignments", label: "Teacher Assignments", module: "staff" },
  { to: "/fee-heads", label: "Fee Heads", module: "fees" },
  { to: "/fee-structures", label: "Fee Structures", module: "fees" },
  { to: "/fee-accounts", label: "Student Fee Accounts", module: "fees" },
  { to: "/invoices", label: "Invoices & Payments", module: "fees" },
  { to: "/reports", label: "Fee Reports", module: "fees" },
  { to: "/audit", label: "Audit Log", module: "audit" }
];

export default function Layout() {
  const { user, can, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>School Enterprise</h1>
        <p className="muted">{user?.fullName}</p>
        <nav>
          {links.filter((l) => can(l.module, "view")).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>{l.label}</NavLink>
          ))}
        </nav>
        <button className="linkish" onClick={logout}>Logout</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
