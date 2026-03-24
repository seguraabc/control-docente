export interface User {
  name: string;
  email: string;
  picture: string;
}

export type CourseTerm = 'anual' | 'primer_cuatrimestre' | 'segundo_cuatrimestre';

export interface Course {
  id: string;
  name: string;
  schedule: string;
  scheduleDays?: number[];
  term?: CourseTerm; // Controla si es anual o de un solo cuatrimestre
  status: 'activo' | 'archivado';
}

export interface Student {
  id: string;
  courseId: string;
  firstName: string;
  lastName: string;
}

export type AttendanceStatus = 'P' | 'A' | 'J';

export interface AttendanceRecord {
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface ClassSession {
  courseId: string;
  date: string; // YYYY-MM-DD
  taught: boolean;
}

export interface EvaluationInstance {
  id: string;
  courseId: string;
  name: string;
  order: number;
}

export interface Grade {
  studentId: string;
  evaluationInstanceId: string;
  value: string; // '1'-'10' or 'A'
}

export interface Semester {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SemesterDates {
  firstSemester: Semester;
  secondSemester: Semester;
}

export interface AppData {
  courses: Course[];
  students: Student[];
  attendance: AttendanceRecord[];
  classSessions: ClassSession[];
  evaluationInstances: EvaluationInstance[];
  grades: Grade[];
  semesterDates: SemesterDates | null;
}