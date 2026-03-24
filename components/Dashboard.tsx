import React, { useMemo } from 'react';
import { Course } from '../types';
import CourseCard from './CourseCard';
import { PlusIcon, CalendarIcon } from './icons';

interface DashboardProps {
  courses: Course[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onArchiveCourse: (id: string) => void;
  onSelectCourse: (id: string) => void;
  onOpenSemesterModal: () => void;
  onDeleteCourse: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onAddCourse, onEditCourse, onArchiveCourse, onSelectCourse, onOpenSemesterModal, onDeleteCourse }) => {

  // Lógica de ordenamiento automático por día de la semana
  const sortedActiveCourses = useMemo(() => {
    const active = courses.filter(c => c.status === 'activo');

    const getSortDay = (days?: number[]) => {
      if (!days || days.length === 0) return 8; // Cursos sin día van al final
      const minDay = Math.min(...days);
      return minDay === 0 ? 7 : minDay; // Convertimos Domingo (0) a 7 para ordenarlo al final de la semana
    };

    return active.sort((a, b) => {
      const dayA = getSortDay(a.scheduleDays);
      const dayB = getSortDay(b.scheduleDays);

      if (dayA !== dayB) {
        return dayA - dayB;
      }
      // Si se dictan el mismo día, orden alfabético
      return a.name.localeCompare(b.name);
    });
  }, [courses]);

  // Los archivados simplemente se ordenan alfabéticamente
  const sortedArchivedCourses = useMemo(() => {
    return courses
      .filter(c => c.status === 'archivado')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mis Cursos</h1>
          <button
            onClick={onOpenSemesterModal}
            className="flex items-center justify-center p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950 focus:ring-indigo-500"
            title="Configurar Fechas de Cuatrimestres"
            aria-label="Abrir calendario de cuatrimestres"
          >
            <CalendarIcon className="h-5 w-5" />
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
        {sortedActiveCourses.length > 0 ? (
          sortedActiveCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={onEditCourse}
              onArchive={onArchiveCourse}
              onSelect={onSelectCourse}
              onDelete={onDeleteCourse}
            />
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-gray-100 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <h3 className="text-xl text-gray-600 dark:text-gray-400">No tienes cursos activos.</h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">¡Crea tu primer curso para empezar a controlar la asistencia!</p>
          </div>
        )}
      </div>

      {sortedArchivedCourses.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-12 mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">Cursos Archivados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedArchivedCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={onEditCourse}
                onArchive={onArchiveCourse}
                onSelect={onSelectCourse}
                onDelete={onDeleteCourse}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;