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
      
      let importedData: Partial<AppData> = {};
      const files = Array.from(e.target.files);
      
      try {
          for (const file of files) {
              const text = await file.text();
              const name = file.name.toLowerCase();

              // Intento de detectar si en realidad es un JSON volcado (rescatado en crudo)
              if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                  try {
                      const jsonData = JSON.parse(text);
                      // Si tiene las propiedades de AppData, lo tomamos directo
                      if (jsonData.courses || jsonData.students) {
                          importedData = { ...importedData, ...jsonData };
                          continue;
                      }
                  } catch (e) {
                      // Ignorar y procesar como CSV
                  }
              }

              const parsed = parseCSV(text);
              
              if (parsed.length > 0) {
                  const firstRow = parsed[0];
                  const firstKey = Object.keys(firstRow)[0];
                  const isMatrix = firstKey && (firstKey.toLowerCase().includes('estudiante') || firstKey.toLowerCase().includes('alumno') || name.includes('asistencia') || name.includes('calificacion'));

                  if (isMatrix) {
                      const isAttendance = name.includes('asistencia') || Object.keys(firstRow).some(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
                      
                      // Extraer un ID de curso estable a partir del nombre del archivo (ej. asistencia_ingles_2026 -> ingles)
                      const coreNameMatch = name.match(/^(?:asistencia|calificaciones?)_(.+?)(?:_\d{4}-\d{2}-\d{2})?\.csv$/i);
                      const coreName = coreNameMatch ? coreNameMatch[1] : name.replace('.csv', '');
                      const courseId = `c_${encodeURIComponent(coreName).replace(/%/g, '').substring(0, 15)}`;
                      const courseName = coreName.replace(/_/g, ' ').toUpperCase();

                      if (!importedData.courses) importedData.courses = [];
                      if (!importedData.courses.find(c => c.id === courseId)) {
                          importedData.courses.push({
                              id: courseId,
                              name: `Recuperado: ${courseName}`,
                              schedule: 'Sin horario',
                              scheduleDays: [],
                              status: 'activo'
                          });
                      }

                      if (!importedData.students) importedData.students = [];
                      
                      const dataHeaders = Object.keys(firstRow).filter(k => k !== firstKey && k.trim() !== '');

                      if (isAttendance) {
                          if (!importedData.attendance) importedData.attendance = [];
                          if (!importedData.classSessions) importedData.classSessions = [];
                          
                          dataHeaders.forEach(date => {
                              if (!importedData.classSessions!.find(cs => cs.courseId === courseId && cs.date === date)) {
                                  importedData.classSessions!.push({ courseId, date, taught: true });
                              }
                          });

                          parsed.forEach(row => {
                              const studentName = row[firstKey];
                              if (!studentName) return;
                              const studentId = `s_${encodeURIComponent(studentName).replace(/%/g, '').substring(0, 15)}`;
                              
                              if (!importedData.students!.find(s => s.id === studentId && s.courseId === courseId)) {
                                  const parts = studentName.split(',');
                                  importedData.students!.push({ 
                                      id: studentId, 
                                      courseId, 
                                      lastName: parts[0]?.trim() || '',
                                      firstName: parts[1]?.trim() || ''
                                  });
                              }
                              
                              dataHeaders.forEach(date => {
                                  const status = row[date];
                                  if (status === 'P' || status === 'A' || status === 'J') {
                                      importedData.attendance!.push({ studentId, date, status });
                                  }
                              });
                          });
                      } else {
                          // Matrices de Calificaciones
                          if (!importedData.grades) importedData.grades = [];
                          if (!importedData.evaluationInstances) importedData.evaluationInstances = [];
                          
                          const evalMap = new Map();
                          dataHeaders.forEach((evalName, index) => {
                              const evalId = `ev_${courseId}_${index}`;
                              evalMap.set(evalName, evalId);
                              if (!importedData.evaluationInstances!.find(ei => ei.id === evalId)) {
                                  importedData.evaluationInstances!.push({ id: evalId, courseId, name: evalName, order: index });
                              }
                          });
                          
                          parsed.forEach(row => {
                              const studentName = row[firstKey];
                              if (!studentName) return;
                              const studentId = `s_${encodeURIComponent(studentName).replace(/%/g, '').substring(0, 15)}`;
                              
                              if (!importedData.students!.find(s => s.id === studentId && s.courseId === courseId)) {
                                  const parts = studentName.split(',');
                                  importedData.students!.push({ 
                                      id: studentId, 
                                      courseId, 
                                      lastName: parts[0]?.trim() || '',
                                      firstName: parts[1]?.trim() || ''
                                  });
                              }
                              
                              dataHeaders.forEach(evalName => {
                                  const val = row[evalName];
                                  if (val && val !== 'N/A' && val.trim() !== '') {
                                      importedData.grades!.push({ studentId, evaluationInstanceId: evalMap.get(evalName), value: val.trim() });
                                  }
                              });
                          });
                      }
                      continue; // Si ya fue procesado como matriz, pasamos al siguiente archivo
                  }
              }

              if (name.includes('course')) {
                  importedData.courses = parsed.map(p => ({...p, scheduleDays: p.scheduleDays ? String(p.scheduleDays).split(/[,;]/).map(Number) : []})) as any;
              } else if (name.includes('student')) {
                  importedData.students = parsed as any;
              } else if (name.includes('attendance') || name.includes('asistencia')) {
                  importedData.attendance = parsed as any;
              } else if (name.includes('session') || name.includes('class') || name.includes('sesion')) {
                  importedData.classSessions = parsed.map(p => ({...p, taught: p.taught === 'true' || p.taught === 'TRUE'})) as any;
              } else if (name.includes('evaluation') || name.includes('evaluacion')) {
                  importedData.evaluationInstances = parsed.map(p => ({...p, order: Number(p.order)})) as any;
              } else if (name.includes('grade') || name.includes('calificacion')) {
                  importedData.grades = parsed as any;
              }
          }
          
          // Reconstrucción inteligente: Crear cursos si no existen pero hay alumnos asociados
          const existingCourseIds = new Set(importedData.courses?.map(c => c.id) || []);
          const neededCourseIds = new Set<string>();

          // Extraer IDs de cursos necesarios de estudiantes, sesiones y evaluaciones
          importedData.students?.forEach(s => neededCourseIds.add(s.courseId));
          importedData.classSessions?.forEach(cs => neededCourseIds.add(cs.courseId));
          importedData.evaluationInstances?.forEach(ei => neededCourseIds.add(ei.courseId));

          const newCourses: any[] = [];
          neededCourseIds.forEach(id => {
              if (id && !existingCourseIds.has(id)) {
                  newCourses.push({
                      id,
                      name: `Curso recuperado (${id})`,
                      schedule: 'Sin horario',
                      scheduleDays: [],
                      status: 'activo'
                  });
              }
          });

          if (newCourses.length > 0) {
              importedData.courses = [...(importedData.courses || []), ...newCourses];
          }

          if (Object.keys(importedData).length === 0) {
              throw new Error("No se pudo extraer información válida de los archivos.");
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
