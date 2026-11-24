import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Classes } from './components/Classes';
import { ClassDetails } from './components/ClassDetails';
import { StudentProfile } from './components/StudentProfile';
import { Subjects } from './components/Subjects';
import { SubjectDetails } from './components/SubjectDetails';
import { AttendanceWorkspace } from './components/AttendanceWorkspace';
import { Exams } from './components/Exams';
import { ExamDetails } from './components/ExamDetails';
import { Assignments } from './components/Assignments';
import { AssignmentDetails } from './components/AssignmentDetails';
import { ReportsWorkspace } from './components/ReportsWorkspace';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicDirectory } from './components/PublicDirectory';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<PublicDirectory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="classes" element={<Classes />} />
              <Route path="classes/:classId" element={<ClassDetails />} />
              <Route path="classes/:classId/student/:studentId" element={<StudentProfile />} />
              
              <Route path="subjects" element={<Subjects />} />
              <Route path="subjects/:subjectId" element={<SubjectDetails />} />
              
              <Route path="attendance" element={<AttendanceWorkspace />} />
              
              <Route path="assignments" element={<Assignments />} />
              <Route path="assignments/:assignmentId" element={<AssignmentDetails />} />
              
              <Route path="exams" element={<Exams />} />
              <Route path="exams/:examId" element={<ExamDetails />} />
              
              <Route path="reports" element={<ReportsWorkspace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
