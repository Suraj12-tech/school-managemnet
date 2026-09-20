import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Layout from "../layout/Layout.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import SchoolPage from "../pages/SchoolPage.jsx";
import YearsPage from "../pages/YearsPage.jsx";
import ClassesPage from "../pages/ClassesPage.jsx";
import SubjectsPage from "../pages/SubjectsPage.jsx";
import UsersPage from "../pages/UsersPage.jsx";
import RolesPage from "../pages/RolesPage.jsx";
import StudentsPage from "../pages/StudentsPage.jsx";
import StudentProfilePage from "../pages/StudentProfilePage.jsx";
import GuardiansPage from "../pages/GuardiansPage.jsx";
import StaffPage from "../pages/StaffPage.jsx";
import AssignmentsPage from "../pages/AssignmentsPage.jsx";
import FeeHeadsPage from "../pages/FeeHeadsPage.jsx";
import FeeStructuresPage from "../pages/FeeStructuresPage.jsx";
import FeeAccountsPage from "../pages/FeeAccountsPage.jsx";
import InvoicesPage from "../pages/InvoicesPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import PayrollPage from "../pages/PayrollPage.jsx";
import ExpensesPage from "../pages/ExpensesPage.jsx";
import FinancialReportsPage from "../pages/FinancialReportsPage.jsx";
import AuditPage from "../pages/AuditPage.jsx";

function ProtectedLayout() {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="school" element={<SchoolPage />} />
        <Route path="years" element={<YearsPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentProfilePage />} />
        <Route path="guardians" element={<GuardiansPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="fee-heads" element={<FeeHeadsPage />} />
        <Route path="fee-structures" element={<FeeStructuresPage />} />
        <Route path="fee-accounts" element={<FeeAccountsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="finance" element={<FinancialReportsPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="financial-reports" element={<FinancialReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}
