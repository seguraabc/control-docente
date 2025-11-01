import React from 'react';
import { Course } from '../types';
import CourseCard from './CourseCard';
import { PlusIcon, CogIcon } from './icons';

interface DashboardProps {
  courses: Course[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onArchiveCourse: (id: string) => void;
  onSelectCourse: (id: string) => void;
  onOpenSemesterModal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onAddCourse, onEditCourse, onArchiveCourse, onSelectCourse, onOpenSemesterModal }) => {
  const activeCourses = courses.filter(c => c.status === 'activo');
  const archivedCourses = courses.filter(c => c.status === 'archivado');

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Cursos</h1>
             <button
                onClick={onOpenSemesterModal}
                className="flex items-center justify-center p-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950 focus:ring-indigo-500"
                title="Configurar Semestres"
                aria-label="Configurar fechas de los semestres"
            >
                <CogIcon className="h-5 w-5" />
            </button>
        </div>
        <button
          onClick={onAddCourse}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950 focus:ring-indigo-500"
        >
          <PlusIcon className="mr-2" />
          Crear Nuevo Curso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCourses.length > 0 ? (
          activeCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={onEditCourse}
              onArchive={onArchiveCourse}
              onSelect={onSelectCourse}
            />
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <h3 className="text-xl text-gray-600 dark:text-gray-400">No tienes cursos activos.</h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">¡Crea tu primer curso para empezar!</p>
          </div>
        )}
      </div>

      {archivedCourses.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-12 mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">Cursos Archivados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={onEditCourse}
                onArchive={onArchiveCourse}
                onSelect={onSelectCourse}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;