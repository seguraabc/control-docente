import React, { useState, useCallback, useEffect } from 'react';
import { Student } from '../types';

interface MassAddStudentModalProps {
  onClose: () => void;
  onAdd: (students: Omit<Student, 'id' | 'courseId'>[]) => void;
}

const MassAddStudentModal: React.FC<MassAddStudentModalProps> = ({ onClose, onAdd }) => {
  const [studentList, setStudentList] = useState('');
  const [error, setError] = useState('');

  const handleAddClick = () => {
    if (!studentList.trim()) {
      setError('La lista no puede estar vacía.');
      return;
    }
    setError('');
    
    const lines = studentList.trim().split('\n');
    const newStudents: Omit<Student, 'id' | 'courseId'>[] = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            let firstName = '';
            let lastName = '';
            // Formato: Apellido, Nombre
            if (trimmedLine.includes(',')) {
                const parts = trimmedLine.split(',').map(p => p.trim());
                lastName = parts[0] || '';
                firstName = parts[1] || '';
            } 
            // Formato: Nombre Apellido
            else {
                const parts = trimmedLine.split(' ').map(p => p.trim());
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ');
            }
            
            if (firstName && lastName) {
                newStudents.push({ firstName, lastName });
            }
        }
    });

    if (newStudents.length > 0) {
      onAdd(newStudents);
    } else {
      setError('No se encontraron estudiantes válidos en la lista. Asegúrate de usar el formato "Apellido, Nombre" o "Nombre Apellido".');
    }
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
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Agregar Estudiantes desde una Lista
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Pega tu lista de estudiantes aquí. Asegúrate de que cada estudiante esté en una nueva línea. Formatos aceptados: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">Apellido, Nombre</code> o <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">Nombre Apellido</code>.
          </p>
          <textarea
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
            className="w-full h-48 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            placeholder="Pérez, Juan&#10;García, María&#10;Ana Gómez"
          />
          {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Agregar Estudiantes
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MassAddStudentModal;
