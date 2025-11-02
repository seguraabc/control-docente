import React, { useState, useMemo, useRef } from 'react';
import { Student, EvaluationInstance, Grade } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './icons';

interface GradesGridProps {
  students: Student[];
  evaluationInstances: EvaluationInstance[];
  grades: Grade[];
  onAddEvaluationInstance: (name: string) => void;
  onUpdateEvaluationOrder: (updatedInstances: EvaluationInstance[]) => void;
  onSetGrade: (studentId: string, evaluationInstanceId: string, value: string) => void;
  onDeleteEvaluationInstance: (instanceId: string) => void;
  onEditEvaluationInstanceName: (instanceId: string, newName: string) => void;
}

const GradesGrid: React.FC<GradesGridProps> = ({ 
    students, evaluationInstances, grades,
    onAddEvaluationInstance, onUpdateEvaluationOrder, onSetGrade,
    onDeleteEvaluationInstance, onEditEvaluationInstanceName
}) => {

  const sortedInstances = useMemo(() => 
    [...evaluationInstances].sort((a, b) => a.order - b.order), 
    [evaluationInstances]
  );
  
  // Drag and drop state
  const draggedItem = useRef<EvaluationInstance | null>(null);
  const dragOverItem = useRef<EvaluationInstance | null>(null);

  const handleAddInstance = () => {
    const name = prompt('Nombre de la nueva instancia de evaluación (ej: TP1):');
    if (name && name.trim()) {
      onAddEvaluationInstance(name.trim());
    }
  };
  
  const handleGradeChange = (studentId: string, instanceId: string, value: string) => {
    onSetGrade(studentId, instanceId, value);
  };
  
  const getGradeForStudent = (studentId: string, instanceId: string) => {
    return grades.find(g => g.studentId === studentId && g.evaluationInstanceId === instanceId)?.value || '';
  };

    const handleEditInstance = (instance: EvaluationInstance) => {
        const newName = prompt('Editar nombre de la instancia de evaluación:', instance.name);
        if (newName && newName.trim() && newName.trim() !== instance.name) {
            onEditEvaluationInstanceName(instance.id, newName.trim());
        }
    };

    const handleDeleteInstance = (instanceId: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta instancia? Todas las calificaciones asociadas se perderán permanentemente.')) {
            onDeleteEvaluationInstance(instanceId);
        }
    };

  // Drag and Drop handlers
  const handleDragStart = (instance: EvaluationInstance) => {
    draggedItem.current = instance;
  };

  const handleDragEnter = (instance: EvaluationInstance) => {
    dragOverItem.current = instance;
  };
  
  const handleDragEnd = () => {
      if (!draggedItem.current || !dragOverItem.current || draggedItem.current.id === dragOverItem.current.id) {
          draggedItem.current = null;
          dragOverItem.current = null;
          return;
      }

      const items = [...sortedInstances];
      const draggedIndex = items.findIndex(item => item.id === draggedItem.current!.id);
      const targetIndex = items.findIndex(item => item.id === dragOverItem.current!.id);

      const [reorderedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, reorderedItem);

      const updatedItems = items.map((item, index) => ({ ...item, order: index }));
      onUpdateEvaluationOrder(updatedItems);
      
      draggedItem.current = null;
      dragOverItem.current = null;
  };


  if (students.length === 0) {
    return (
       <div className="p-6 text-center">
         <p className="text-gray-500">Agrega estudiantes para poder registrar calificaciones.</p>
       </div>
    );
  }

  return (
    <div>
      <div className="p-4 flex justify-end border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={handleAddInstance}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Agregar Instancia
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 min-w-[150px]">
                Estudiante
              </th>
              {sortedInstances.map((instance) => (
                <th 
                  key={instance.id} 
                  scope="col" 
                  className="px-2 py-3 text-center cursor-move group"
                  draggable
                  onDragStart={() => handleDragStart(instance)}
                  onDragEnter={() => handleDragEnter(instance)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                    <div className="flex items-center justify-center gap-1">
                        <span>{instance.name}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleEditInstance(instance); }} 
                                className="p-1 text-gray-500 hover:text-indigo-500 rounded-full"
                                title="Editar nombre"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteInstance(instance.id); }} 
                                className="p-1 text-gray-500 hover:text-red-500 rounded-full"
                                title="Eliminar instancia"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-900 z-10">
                  {student.lastName}, {student.firstName}
                </td>
                {sortedInstances.map((instance) => (
                  <td key={instance.id} className="px-2 py-1 text-center">
                    <input
                      type="text"
                      value={getGradeForStudent(student.id, instance.id)}
                      onChange={(e) => handleGradeChange(student.id, instance.id, e.target.value)}
                      className="w-20 h-8 text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradesGrid;