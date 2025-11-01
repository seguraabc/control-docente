import React, { useState } from 'react';
import { Student } from '../types';
import { TrashIcon, PlusIcon } from './icons';
import MassAddStudentModal from './MassAddStudentModal';

interface StudentListProps {
  students: Student[];
  onAddStudent: (studentData: Omit<Student, 'id' | 'courseId'>) => void;
  onAddMultipleStudents: (studentsData: Omit<Student, 'id' | 'courseId'>[]) => void;
  onDeleteStudent: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent, onAddMultipleStudents, onDeleteStudent }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    setError('');
    onAddStudent({ firstName, lastName });
    setFirstName('');
    setLastName('');
  };

  const handleMassAdd = (studentList: Omit<Student, 'id' | 'courseId'>[]) => {
    onAddMultipleStudents(studentList);
    setIsMassModalOpen(false);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Lista de Estudiantes
      </h2>
      
      <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="w-full">
                <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="w-full">
                <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button type="submit" className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
                <PlusIcon className="mr-2" />
                Agregar
            </button>
        </form>
        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
        <div className="mt-3 text-center">
            <button 
                onClick={() => setIsMassModalOpen(true)} 
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                o agregar desde una lista
            </button>
        </div>
      </div>


      <div className="space-y-3">
        {students.length > 0 ? (
          students.map((student, index) => (
            <div key={student.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <span className="text-gray-800 dark:text-gray-300">{index + 1}. {student.lastName}, {student.firstName}</span>
              <button
                onClick={() => onDeleteStudent(student.id)}
                className="text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-full"
                aria-label={`Eliminar a ${student.firstName} ${student.lastName}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-500 text-center py-4">No hay estudiantes en este curso.</p>
        )}
      </div>
       {isMassModalOpen && (
        <MassAddStudentModal 
          onClose={() => setIsMassModalOpen(false)}
          onAdd={handleMassAdd}
        />
      )}
    </div>
  );
};

export default StudentList;