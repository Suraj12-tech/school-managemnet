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
import { TeachingAssignments } from './components/TeachingAssignments';
import { TeachingAssignmentDetails } from './components/TeachingAssignmentDetails';
import { TeacherAssessments } from './components/TeacherAssessments';
import { TeacherAssessmentDetails } from './components/TeacherAssessmentDetails';
import { ReportsWorkspace } from './components/ReportsWorkspace';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
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
              <Route path="teaching-assignments" element={<TeachingAssignments />} />
              <Route path="teaching-assignments/:assignmentId" element={<TeachingAssignmentDetails />} />
              <Route path="assessments" element={<TeacherAssessments />} />
              <Route path="assessments/:assessmentId" element={<TeacherAssessmentDetails />} />
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
