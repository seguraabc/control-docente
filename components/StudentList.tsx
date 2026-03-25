import React, { useState } from 'react';
import { Student } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface StudentListProps {
  students: Student[];
  onAddStudent: (studentData: Omit<Student, 'id' | 'courseId'>) => void;
  onAddMultipleStudents: (studentsData: Omit<Student, 'id' | 'courseId'>[]) => void;
  onEditStudent: (id: string, firstName: string, lastName: string) => void;
  onDeleteStudent: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent, onAddMultipleStudents, onEditStudent, onDeleteStudent }) => {
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFirstName.trim() && newLastName.trim()) {
      onAddStudent({ firstName: newFirstName.trim(), lastName: newLastName.trim() });
      setNewFirstName('');
      setNewLastName('');
    }
  };

  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n');
    const newStudents: Omit<Student, 'id' | 'courseId'>[] = [];

    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const lastName = parts[0].trim();
        const firstName = parts.slice(1).join(',').trim();
        if (lastName && firstName) {
          newStudents.push({ firstName, lastName });
        }
      }
    });

    if (newStudents.length > 0) {
      onAddMultipleStudents(newStudents);
      setBulkText('');
      setIsBulkMode(false);
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditFirstName(student.firstName);
    setEditLastName(student.lastName);
  };

  const saveEdit = (id: string) => {
    if (editFirstName.trim() && editLastName.trim()) {
      onEditStudent(id, editFirstName.trim(), editLastName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agregar Estudiantes</h3>
          <button
            onClick={() => setIsBulkMode(!isBulkMode)}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            {isBulkMode ? 'Cambiar a modo individual' : 'Cambiar a carga masiva'}
          </button>
        </div>

        {!isBulkMode ? (
          <form onSubmit={handleAddSingle} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
              <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors">Agregar</button>
          </form>
        ) : (
          <form onSubmit={handleAddBulk} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pega la lista (Formato: Apellido, Nombre)</label>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} required rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Gomez, Juan&#10;Perez, Maria" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition-colors">Agregar Lista</button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Estudiante</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {students.length === 0 ? (
              <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">No hay estudiantes registrados.</td></tr>
            ) : (
              students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {editingId === student.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 w-1/2" placeholder="Apellido" />
                        <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 w-1/2" placeholder="Nombre" />
                      </div>
                    ) : (
                      `${student.lastName.toUpperCase()}, ${student.firstName}`
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {editingId === student.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveEdit(student.id)} className="text-xs font-semibold text-green-700 hover:text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 px-3 py-1.5 rounded transition-colors">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 rounded transition-colors">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(student)} className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Editar estudiante">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDeleteStudent(student.id)} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar estudiante">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;