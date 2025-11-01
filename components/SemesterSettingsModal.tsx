import React, { useState, useEffect, useCallback } from 'react';
import { SemesterDates } from '../types';

interface SemesterSettingsModalProps {
  currentDates: SemesterDates | null;
  onClose: () => void;
  onSave: (dates: SemesterDates) => void;
}

const SemesterSettingsModal: React.FC<SemesterSettingsModalProps> = ({ currentDates, onClose, onSave }) => {
  const [firstSemesterStart, setFirstSemesterStart] = useState('');
  const [firstSemesterEnd, setFirstSemesterEnd] = useState('');
  const [secondSemesterStart, setSecondSemesterStart] = useState('');
  const [secondSemesterEnd, setSecondSemesterEnd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentDates) {
      setFirstSemesterStart(currentDates.firstSemester.startDate);
      setFirstSemesterEnd(currentDates.firstSemester.endDate);
      setSecondSemesterStart(currentDates.secondSemester.startDate);
      setSecondSemesterEnd(currentDates.secondSemester.endDate);
    }
  }, [currentDates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstSemesterStart || !firstSemesterEnd || !secondSemesterStart || !secondSemesterEnd) {
      setError('Todas las fechas son obligatorias.');
      return;
    }
    setError('');
    onSave({
      firstSemester: { startDate: firstSemesterStart, endDate: firstSemesterEnd },
      secondSemester: { startDate: secondSemesterStart, endDate: secondSemesterEnd },
    });
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

  const DateInput: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
        <input
            type="date"
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-semester"
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-scale 0.3s forwards' }}
      >
        <div className="p-6">
          <h2 id="modal-title-semester" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Configurar Fechas de Cuatrimestres
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Primer Cuatrimestre</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateInput label="Fecha de Inicio" value={firstSemesterStart} onChange={e => setFirstSemesterStart(e.target.value)} />
                        <DateInput label="Fecha de Fin" value={firstSemesterEnd} onChange={e => setFirstSemesterEnd(e.target.value)} />
                    </div>
                </div>
                 <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Segundo Cuatrimestre</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateInput label="Fecha de Inicio" value={secondSemesterStart} onChange={e => setSecondSemesterStart(e.target.value)} />
                        <DateInput label="Fecha de Fin" value={secondSemesterEnd} onChange={e => setSecondSemesterEnd(e.target.value)} />
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
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
        /* Style for date picker icon */
        .dark input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SemesterSettingsModal;