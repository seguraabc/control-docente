import React, { useState } from 'react';
import { Course } from '../types';
import { PencilIcon, ArchiveIcon, UnarchiveIcon, TrashIcon } from './icons';

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onArchive: (id: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit, onArchive, onSelect, onDelete }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(course.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer ${course.status === 'archivado' ? 'opacity-75' : ''}`}
        onClick={() => onSelect(course.id)}
      >
        {/* Contenedor principal con margen derecho para no chocar con la columna de iconos */}
        <div className="pr-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-4">{course.name}</h3>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><span className="font-semibold">Horario:</span> {course.schedule}</p>
            <p><span className="font-semibold">Periodo:</span> {course.term === 'anual' ? 'Anual' : course.term === 'primer_cuatrimestre' ? '1° Cuatrimestre' : '2° Cuatrimestre'}</p>
          </div>
        </div>

        {/* Iconos en columna vertical sobre el borde derecho */}
        <div className="absolute top-4 right-3 flex flex-col gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(course); }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(course.id); }}
            className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={course.status === 'activo' ? 'Archivar' : 'Desarchivar'}
          >
            {course.status === 'activo' ? <ArchiveIcon className="w-5 h-5" /> : <UnarchiveIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Eliminar definitivamente"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <TrashIcon className="w-6 h-6" /> Eliminar Curso
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-base">
              Estás por eliminar <strong className="text-gray-900 dark:text-white font-bold">{course.name}</strong> y todos los datos asociados. Esta acción no se puede deshacer ¿Confirma eliminación definitiva?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                No, volver atrás
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseCard;