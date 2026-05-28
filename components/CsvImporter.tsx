import React, { useState } from 'react';
import { AppData } from '../types';

interface CsvImporterProps {
  onImportComplete: (data: Partial<AppData>) => void;
  onCancel: () => void;
}

const CsvImporter: React.FC<CsvImporterProps> = ({ onImportComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const parseCSV = (text: string) => {
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) return [];
      
      const parseLine = (line: string) => {
          const result = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
              if (line[i] === '"') {
                  // Manejar doble comilla escapada dentro de comillas
                  if (inQuotes && line[i+1] === '"') {
                      cur += '"';
                      i++;
                  } else {
                      inQuotes = !inQuotes;
                  }
              } else if (line[i] === ',' && !inQuotes) {
                  result.push(cur);
                  cur = '';
              } else {
                  cur += line[i];
              }
          }
          result.push(cur);
          return result;
      };
      
      const headers = parseLine(lines[0]).map(h => h.trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          const obj: any = {};
          headers.forEach((h, idx) => {
              obj[h] = (values[idx] || '').trim();
          });
          data.push(obj);
      }
      return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      setLoading(true);
      setError(null);
      
      const importedData: Partial<AppData> = {};
      const files = Array.from(e.target.files);
      
      try {
          for (const file of files) {
              const text = await file.text();
              const parsed = parseCSV(text);
              const name = file.name.toLowerCase();
              
              if (name.includes('course')) {
                  importedData.courses = parsed.map(p => ({...p, scheduleDays: p.scheduleDays ? String(p.scheduleDays).split(/[,;]/).map(Number) : []})) as any;
              } else if (name.includes('student')) {
                  importedData.students = parsed as any;
              } else if (name.includes('attendance')) {
                  importedData.attendance = parsed as any;
              } else if (name.includes('session') || name.includes('class')) {
                  importedData.classSessions = parsed.map(p => ({...p, taught: p.taught === 'true' || p.taught === 'TRUE'})) as any;
              } else if (name.includes('evaluation')) {
                  importedData.evaluationInstances = parsed.map(p => ({...p, order: Number(p.order)})) as any;
              } else if (name.includes('grade')) {
                  importedData.grades = parsed as any;
              }
          }
          
          onImportComplete(importedData);
      } catch (err: any) {
          setError(err.message || 'Error al parsear los archivos CSV.');
      } finally {
          setLoading(false);
      }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Importar Datos (CSV)</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Selecciona los archivos CSV rescatados. Asegúrate de que los nombres de los archivos contengan el nombre de la tabla (ej. courses, students, attendance, grades).
              </p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input 
                      type="file" 
                      multiple 
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="csv-upload" 
                      disabled={loading}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                      <svg className="w-10 h-10 text-indigo-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                          {loading ? 'Procesando...' : 'Haz clic para seleccionar múltiples archivos CSV'}
                      </span>
                  </label>
              </div>
              
              {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg">
                      {error}
                  </div>
              )}
              
              <div className="mt-6 flex justify-end">
                  <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      Cancelar
                  </button>
              </div>
          </div>
      </div>
  );
};

export default CsvImporter;
