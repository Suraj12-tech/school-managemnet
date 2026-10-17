import { apiRequest, setToken } from "./apiClient";

export interface LoginResult {
  token: string;
  userId: number;
}

export interface TeacherProfile {
  userId: number;
  staffId: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface TeacherClass {
  id: number;
  schoolId: number;
  name: string;
  numberOfClassrooms: number;
}

export interface TeacherSection {
  id: number;
  name: string;
  classId: number;
  academicYearId: number;
  status: string;
}

export interface TeacherSubject {
  id: number;
  schoolId: number;
  name: string;
  code: string;
  description: string | null;
}

export interface TeacherAcademicYear {
  id: number;
  name: string;
  status: string;
  currentYear: boolean;
}

export interface StudentRosterEntry {
  studentIdentifier: string | null;
  fullName: string;
}

export interface TeacherAssignment {
  id: number;
  staffId: number;
  teacherName: string;
  subjectId: number | null;
  subjectName: string | null;
  classId: number;
  className: string;
  sectionId: number | null;
  sectionName: string | null;
  academicYearId: number;
  academicYearName: string;
  assignmentType: string;
  status: string;
}

export interface TeacherTimetableEntry {
  id: number;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  academicYearId: number;
  academicYearName: string;
  dayOfWeek: string;
  periodNumber: number;
  periodName: string | null;
  startTime: string | null;
  endTime: string | null;
  subjectId: number;
  subjectName: string | null;
  room: string | null;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface TeacherAttendanceEntry {
  studentIdentifier: string;
  fullName: string;
  status: AttendanceStatus | null;
}

export interface TeacherAttendance {
  sectionId: number;
  date: string;
  canManageAttendance: boolean;
  records: TeacherAttendanceEntry[];
}

export interface TeacherAssessment {
  id: number;
  title: string;
  classId: number;
  className: string;
  sectionId: number | null;
  sectionName: string | null;
  subjectId: number;
  subjectName: string;
  academicYearId: number;
  academicYearName: string;
  assessmentDate: string;
  maxMarks: number;
  status: "PUBLISHED";
}

export interface TeacherReport {
  attendance: {
    sectionId: number;
    fromDate: string;
    toDate: string;
    present: number;
    absent: number;
    late: number;
    totalRecorded: number;
  };
  assignments: {
    classId: number;
    className: string;
    sectionId: number | null;
    sectionName: string | null;
    subjectId: number | null;
    subjectName: string | null;
    academicYearId: number;
    academicYearName: string;
    assignmentTypes: string[];
  }[];
  assessments: {
    publishedCount: number;
    publishedAssessments: TeacherAssessment[];
  };
}

interface Credentials {
  username: string;
  password: string;
}

export const teacherApi = {
  async login(credentials: Credentials): Promise<LoginResult> {
    const result = await apiRequest<LoginResult>("/api/auth/login", {
      method: "POST",
      body: credentials,
      authenticated: false
    });
    if (!result || typeof result.token !== "string" || !result.token) {
      throw new Error("The API did not return a valid login token.");
    }
    setToken(result.token);
    return result;
  },

  profile: () => apiRequest<TeacherProfile>("/api/teacher/profile"),
  classes: () => apiRequest<TeacherClass[]>("/api/teacher/classes"),
  schoolClass: (id: number) => apiRequest<TeacherClass>(`/api/teacher/classes/${id}`),
  sections: () => apiRequest<TeacherSection[]>("/api/teacher/sections"),
  subjects: () => apiRequest<TeacherSubject[]>("/api/teacher/subjects"),
  subject: (id: number) => apiRequest<TeacherSubject>(`/api/teacher/subjects/${id}`),
  students: (sectionId: number) =>
    apiRequest<StudentRosterEntry[]>(`/api/teacher/sections/${sectionId}/students`),
  student: (id: number) => apiRequest<StudentRosterEntry>(`/api/teacher/students/${id}`),
  academicYears: () => apiRequest<TeacherAcademicYear[]>("/api/teacher/academic-years"),
  assignments: (academicYearId?: number) => apiRequest<TeacherAssignment[]>(
    `/api/teacher/assignments${academicYearId === undefined ? "" : `?academicYearId=${academicYearId}`}`
  ),
  assignment: (id: number) => apiRequest<TeacherAssignment>(`/api/teacher/assignments/${id}`),
  timetable: (academicYearId?: number) => apiRequest<TeacherTimetableEntry[]>(
    `/api/teacher/timetable${academicYearId === undefined ? "" : `?academicYearId=${academicYearId}`}`
  ),
  attendance: (sectionId: number, date: string) =>
    apiRequest<TeacherAttendance>(`/api/teacher/attendance?sectionId=${sectionId}&date=${date}`),
  saveAttendance: (attendance: {
    sectionId: number;
    date: string;
    records: { studentIdentifier: string; status: AttendanceStatus }[];
  }) => apiRequest<TeacherAttendance>("/api/teacher/attendance", {
    method: "PUT",
    body: attendance
  }),
  assessments: () => apiRequest<TeacherAssessment[]>("/api/teacher/assessments"),
  assessment: (id: number) => apiRequest<TeacherAssessment>(`/api/teacher/assessments/${id}`),
  reports: (sectionId: number, fromDate: string, toDate: string) =>
    apiRequest<TeacherReport>(`/api/teacher/reports?sectionId=${sectionId}&fromDate=${fromDate}&toDate=${toDate}`),
  logout: () => apiRequest<void>("/api/auth/logout", { method: "POST" })
};
