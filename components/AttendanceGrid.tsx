import React, { useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, ClassSession, SemesterDates } from '../types';
import { DownloadIcon } from './icons';

interface AttendanceGridProps {
  students: Student[];
  attendance: AttendanceRecord[];
  classSessions: ClassSession[];
  courseName: string;
  courseSchedule: string;
  semesterDates: SemesterDates | null;
  onSetAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
  onToggleClassSession: (date: string) => void;
}

const DAY_MAP: { [key: string]: number } = {
  domingo: 0, lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6
};

// Helper para generar las fechas de clase basadas en el horario y los cuatrimestres
const generateClassDates = (schedule: string, semesterDates: SemesterDates | null): string[] => {
    if (!semesterDates) return [];
    
    const scheduleDays = Object.keys(DAY_MAP).filter(day => 
        new RegExp(day, 'i').test(schedule)
    ).map(day => DAY_MAP[day]);

    if (scheduleDays.length === 0) return [];
    
    const allDates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processSemester = (startDateStr: string, endDateStr: string) => {
        if (!startDateStr || !endDateStr) return;
        
        let currentDate = new Date(startDateStr + 'T00:00:00');
        const endDate = new Date(endDateStr + 'T00:00:00');
        
        while (currentDate <= endDate && currentDate <= today) {
            if (scheduleDays.includes(currentDate.getDay())) {
                allDates.push(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    };

    processSemester(semesterDates.firstSemester.startDate, semesterDates.firstSemester.endDate);
    processSemester(semesterDates.secondSemester.startDate, semesterDates.secondSemester.endDate);

    return allDates;
};


const AttendanceGrid: React.FC<AttendanceGridProps> = ({ students, attendance, classSessions, courseName, courseSchedule, semesterDates, onSetAttendance, onToggleClassSession }) => {
  const classDates = useMemo(() => generateClassDates(courseSchedule, semesterDates), [courseSchedule, semesterDates]);

  if (!semesterDates || !semesterDates.firstSemester.startDate) {
    return (
        <div className="p-6 text-center">
            <p className="text-gray-400">Por favor, configure las fechas de inicio y fin de los cuatrimestres.</p>
            <p className="text-sm text-gray-500 mt-2">Puede hacerlo desde el panel principal, usando el ícono de engranaje.</p>
        </div>
    );
  }

  const getStatusForStudent = (studentId: string, date: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === date)?.status;
  };

  const statusColors: { [key in AttendanceStatus]: string } = {
    P: 'bg-green-500 hover:bg-green-600 text-white',
    A: 'bg-red-500 hover:bg-red-600 text-white',
    J: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  };
  
  const taughtClassDates = useMemo(() => classDates.filter(date => {
      const session = classSessions.find(s => s.date === date);
      return session ? session.taught : false; // Por defecto, una clase no se considera dictada
  }), [classDates, classSessions]);

  const handleExportCSV = () => {
    const headers = ['Estudiante', ...classDates, 'Asistencia %'];
    
    const rows = students.map(student => {
        const studentName = `${student.lastName}, ${student.firstName}`;
        const attendanceStatuses = classDates.map(date => getStatusForStudent(student.id, date) || 'N/A');
        
        const taughtClassesCount = taughtClassDates.length;
        const presentCount = attendance.filter(a =>
            a.studentId === student.id &&
            a.status === 'P' &&
            taughtClassDates.includes(a.date)
        ).length;
        const percentage = taughtClassesCount > 0 ? Math.round((presentCount / taughtClassesCount) * 100) : 100;

        return [studentName, ...attendanceStatuses, `${percentage}%`];
    });

    const toCSV = (arr: (string|number)[]) => arr.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');

    let csvContent = [
        toCSV(headers),
        ...rows.map(row => toCSV(row))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const safeCourseName = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `asistencia_${safeCourseName}_${today}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  if (students.length === 0) {
    return (
       <div className="p-6 text-center">
         <p className="text-gray-500">Agrega estudiantes para poder registrar la asistencia.</p>
       </div>
    );
  }
  
  return (
    <div>
      <div className="p-4 flex justify-end border-b border-gray-800">
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-indigo-500"
        >
          <DownloadIcon className="mr-2 h-5 w-5" />
          Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
                <th scope="col" className="px-4 py-3 sticky left-0 bg-gray-800 z-10 min-w-[150px]">
                Estudiante
                </th>
                {classDates.map(date => {
                    const session = classSessions.find(s => s.date === date);
                    const isTaught = session ? session.taught : false; // Por defecto, la clase no está dictada
                    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                    return (
                    <th key={date} scope="col" className="px-4 py-2 text-center align-top">
                            <div className="flex flex-col items-center justify-start gap-2 h-full">
                                <span>{dateLabel}</span>
                                <input
                                    type="checkbox"
                                    checked={isTaught}
                                    onChange={() => onToggleClassSession(date)}
                                    className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-600 focus:ring-offset-gray-800 cursor-pointer"
                                    aria-label={`Marcar clase del ${dateLabel} como ${isTaught ? 'no dictada' : 'dictada'}`}
                                    title={isTaught ? "Clase dictada (cuenta para asistencia)" : "Clase no dictada (marcar para tomar asistencia)"}
                                />
                            </div>
                        </th>
                    )
                })}
                <th scope="col" className="px-4 py-3 text-center sticky right-0 bg-gray-800 z-10">
                    Asistencia %
                </th>
            </tr>
            </thead>
            <tbody>
            {students.map((student) => {
                const taughtClassesCount = taughtClassDates.length;
                const presentCount = attendance.filter(a =>
                    a.studentId === student.id &&
                    a.status === 'P' &&
                    taughtClassDates.includes(a.date)
                ).length;
            
                const percentage = taughtClassesCount > 0 ? Math.round((presentCount / taughtClassesCount) * 100) : 0;

                return (
                    <tr key={student.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="px-4 py-2 font-medium text-gray-200 sticky left-0 bg-gray-900/50 hover:bg-gray-800/50 z-10">
                        {student.lastName}, {student.firstName}
                    </td>
                    {classDates.map(date => {
                        const currentStatus = getStatusForStudent(student.id, date);
                        const session = classSessions.find(s => s.date === date);
                        const isTaught = session ? session.taught : false; // Por defecto, la clase no está dictada
                        return (
                        <td key={date} className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-1">
                            {(['P', 'A', 'J'] as AttendanceStatus[]).map(status => (
                                <button
                                    key={status}
                                    onClick={() => onSetAttendance(student.id, date, status)}
                                    disabled={!isTaught}
                                    className={`w-7 h-7 font-bold rounded-full transition-all duration-200 text-xs
                                        ${currentStatus === status && isTaught ? statusColors[status] + ' opacity-100' : 'bg-gray-700 text-gray-300'}
                                        ${!isTaught ? 'opacity-30 cursor-not-allowed' : `hover:${statusColors[status].split(' ')[1]} opacity-60 hover:opacity-100`}
                                    `}
                                    >
                                {status}
                                </button>
                            ))}
                            </div>
                        </td>
                        );
                    })}
                    <td className="px-4 py-2 text-center font-medium sticky right-0 bg-gray-900/50 hover:bg-gray-800/50 z-10">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            percentage >= 80 ? 'bg-green-500/20 text-green-300' :
                            percentage >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                            {percentage}%
                        </span>
                    </td>
                    </tr>
                );
            })}
            </tbody>
        </table>
       </div>
    </div>
  );
};

export default AttendanceGrid;