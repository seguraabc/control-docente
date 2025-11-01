import React, { useState, useEffect, useCallback } from 'react';
import { Course } from '../types';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onSave: (courseData: Omit<Course, 'id' | 'status'>) => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ course, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setName(course.name);
      setSchedule(course.schedule);
    } else {
      setName('');
      setSchedule('');
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schedule.trim()) {
      setError('Ambos campos son obligatorios.');
      return;
    }
    setError('');
    onSave({ name, schedule });
  };
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-100 mb-4">
            {course ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="course-name" className="block text-sm font-medium text-gray-400 mb-1">
                Nombre del curso
              </label>
              <input
                id="course-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Cálculo I"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="course-schedule" className="block text-sm font-medium text-gray-400 mb-1">
                Días y horarios
              </label>
              <input
                id="course-schedule"
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Lunes 10-12, Miércoles 10-12"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default CourseModal;
