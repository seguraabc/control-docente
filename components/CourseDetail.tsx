import React, { useState } from 'react';
import { Course, Student, AttendanceRecord, AttendanceStatus, ClassSession, EvaluationInstance, Grade, SemesterDates } from '../types';
import StudentList from './StudentList';
import AttendanceGrid from './AttendanceGrid';
import GradesGrid from './GradesGrid';

interface CourseDetailProps {
  course: Course;
  students: Student[];
  attendance: AttendanceRecord[];
  classSessions: ClassSession[];
  evaluationInstances: EvaluationInstance[];
  grades: Grade[];
  semesterDates: SemesterDates | null;
  onBack: () => void;
  onAddStudent: (studentData: Omit<Student, 'id' | 'courseId'>) => void;
  onAddMultipleStudents: (studentsData: Omit<Student, 'id' | 'courseId'>[]) => void;
  onDeleteStudent: (studentId: string) => void;
  onSetAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
  onToggleClassSession: (date: string) => void;
  onAddEvaluationInstance: (name: string) => void;
  onUpdateEvaluationOrder: (updatedInstances: EvaluationInstance[]) => void;
  onSetGrade: (studentId: string, evaluationInstanceId: string, value: string) => void;
}

type ActiveTab = 'students' | 'attendance' | 'grades';

const CourseDetail: React.FC<CourseDetailProps> = (props) => {
  const { 
      course, students, 
      onBack, 
  } = props;
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          &larr; Volver a Mis Cursos
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{course.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{course.schedule}</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('students')}
            className={`${
              activeTab === 'students'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Estudiantes ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`${
              activeTab === 'attendance'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Asistencia
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`${
              activeTab === 'grades'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Calificaciones
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        {activeTab === 'students' && (
          <StudentList
            students={props.students}
            onAddStudent={props.onAddStudent}
            onAddMultipleStudents={props.onAddMultipleStudents}
            onDeleteStudent={props.onDeleteStudent}
          />
        )}
        {activeTab === 'attendance' && (
           <AttendanceGrid
            students={props.students}
            attendance={props.attendance}
            classSessions={props.classSessions}
            courseName={course.name}
            courseSchedule={course.schedule}
            semesterDates={props.semesterDates}
            onSetAttendance={props.onSetAttendance}
            onToggleClassSession={props.onToggleClassSession}
          />
        )}
         {activeTab === 'grades' && (
           <GradesGrid
            students={props.students}
            evaluationInstances={props.evaluationInstances}
            grades={props.grades}
            onAddEvaluationInstance={props.onAddEvaluationInstance}
            onUpdateEvaluationOrder={props.onUpdateEvaluationOrder}
            onSetGrade={props.onSetGrade}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDetail;