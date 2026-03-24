import React, { useState, useEffect } from 'react';
import { Course, CourseTerm } from '../types';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onSave: (courseToSave: Omit<Course, 'id' | 'status'>) => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
];

const CourseModal: React.FC<CourseModalProps> = ({ course, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [term, setTerm] = useState<CourseTerm>('anual');

  useEffect(() => {
    if (course) {
      setName(course.name);
      setSchedule(course.schedule);
      setScheduleDays(course.scheduleDays || []);
      setTerm(course.term || 'anual');
    }
  }, [course]);

  const handleToggleDay = (dayId: number) => {
    setScheduleDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, schedule, scheduleDays, term });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {course ? 'Editar Curso' : 'Nuevo Curso'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Curso
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ej: Programación Avanzada"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horario (Texto)
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Ej: 18:00 a 20:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Periodo
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value as CourseTerm)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="anual">Anual</option>
                <option value="primer_cuatrimestre">1° Cuatrimestre</option>
                <option value="segundo_cuatrimestre">2° Cuatrimestre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días de cursada (Para grilla de asistencia)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleToggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${scheduleDays.includes(day.id)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {scheduleDays.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Selecciona al menos un día para generar la asistencia.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors"
            >
              Guardar Curso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;