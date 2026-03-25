import React, { useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, ClassSession, SemesterDates, Course } from '../types';
import { DownloadIcon } from './icons';

interface AttendanceGridProps {
    students: Student[];
    attendance: AttendanceRecord[];
    classSessions: ClassSession[];
    course: Course;
    semesterDates: SemesterDates | null;
    onSetAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
    onSetBulkAttendance: (date: string, status: AttendanceStatus, studentIds: string[]) => void;
    onToggleClassSession: (date: string) => void;
}

const generateClassDates = (course: Course, semesterDates: SemesterDates | null): string[] => {
    if (!semesterDates) return [];

    let activeDays: number[] = [];
    if (course.scheduleDays && course.scheduleDays.length > 0) {
        activeDays = course.scheduleDays;
    } else {
        const DAY_MAP: { [key: string]: number } = { domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3, jueves: 4, viernes: 5, sábado: 6, sabado: 6 };
        activeDays = Object.keys(DAY_MAP).filter(day =>
            new RegExp(`\\b${day}\\b`, 'i').test(course.schedule)
        ).map(day => DAY_MAP[day]);
    }

    if (activeDays.length === 0) return [];

    const allDates: string[] = [];
    const courseTerm = course.term || 'anual';

    const processSemester = (startDateStr: string, endDateStr: string) => {
        if (!startDateStr || !endDateStr) return;

        const [startYear, startMonth, startDay] = startDateStr.split('-');
        let currentDate = new Date(Number(startYear), Number(startMonth) - 1, Number(startDay));

        const [endYear, endMonth, endDay] = endDateStr.split('-');
        const endDate = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay));

        while (currentDate <= endDate) {
            if (activeDays.includes(currentDate.getDay())) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                allDates.push(`${year}-${month}-${day}`);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    };

    if (courseTerm === 'anual' || courseTerm === 'primer_cuatrimestre') {
        processSemester(semesterDates.firstSemester.startDate, semesterDates.firstSemester.endDate);
    }

    if (courseTerm === 'anual' || courseTerm === 'segundo_cuatrimestre') {
        processSemester(semesterDates.secondSemester.startDate, semesterDates.secondSemester.endDate);
    }

    return allDates;
};

const AttendanceButton: React.FC<{
    currentStatus?: AttendanceStatus;
    status: AttendanceStatus;
    onClick: () => void;
    disabled: boolean;
}> = ({ currentStatus, status, onClick, disabled }) => {
    const statusColors: { [key in AttendanceStatus]: string } = {
        P: 'bg-green-500 hover:bg-green-600 text-white',
        A: 'bg-red-500 hover:bg-red-600 text-white',
        J: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-7 h-7 font-bold rounded-full transition-all duration-200 text-xs flex-shrink-0
                ${currentStatus === status && !disabled ? statusColors[status] + ' opacity-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}
                ${disabled ? 'opacity-30 cursor-not-allowed' : `hover:${statusColors[status].split(' ')[1]} opacity-60 hover:opacity-100`}
            `}
        >
            {status}
        </button>
    );
};

const AttendanceGrid: React.FC<AttendanceGridProps> = ({ students, attendance, classSessions, course, semesterDates, onSetAttendance, onSetBulkAttendance, onToggleClassSession }) => {
    const classDates = useMemo(() => generateClassDates(course, semesterDates), [course, semesterDates]);

    if (!semesterDates || !semesterDates.firstSemester.startDate) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">Por favor, configure las fechas de inicio y fin de los cuatrimestres.</p>
                <p className="text-sm text-gray-500 mt-2">Puede hacerlo desde el panel principal, usando el ícono de engranaje.</p>
            </div>
        );
    }

    const getStatusForStudent = (studentId: string, date: string) => {
        return attendance.find(a => a.studentId === studentId && a.date === date)?.status;
    };

    const taughtClassDates = useMemo(() => classDates.filter(date => {
        const session = classSessions.find(s => s.date === date);
        return session ? session.taught : false;
    }), [classDates, classSessions]);

    const handleExportCSV = () => {
        const headers = ['Estudiante', ...classDates, 'Asistencia %'];

        const rows = students.map(student => {
            const studentName = `${student.lastName.toUpperCase()}, ${student.firstName}`;
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

        const toCSV = (arr: (string | number)[]) => arr.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');

        let csvContent = [
            toCSV(headers),
            ...rows.map(row => toCSV(row))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        const safeCourseName = course.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
                <p className="text-gray-500 dark:text-gray-500">Agrega estudiantes para poder registrar la asistencia.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="md:hidden portrait:flex landscape:hidden items-center justify-center p-4 text-center bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 m-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="font-semibold text-sm">Para una mejor experiencia, por favor rota tu dispositivo a modo horizontal.</p>
            </div>
            <div className="p-4 flex justify-end border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                    <DownloadIcon className="mr-2 h-5 w-5" />
                    Exportar CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-4 py-3 sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 min-w-[200px] border-r border-gray-200 dark:border-gray-700">
                                Estudiante
                            </th>
                            {classDates.map(date => {
                                const session = classSessions.find(s => s.date === date);
                                const isTaught = session ? session.taught : false;
                                const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                return (
                                    <th key={date} scope="col" className="px-2 py-3 text-center align-top min-w-[80px]">
                                        <div className="flex flex-col items-center justify-start gap-2 h-full">
                                            <span className="whitespace-nowrap">{dateLabel}</span>
                                            <input
                                                type="checkbox"
                                                checked={isTaught}
                                                onChange={() => onToggleClassSession(date)}
                                                className="w-4 h-4 text-indigo-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 cursor-pointer"
                                                aria-label={`Marcar clase del ${dateLabel}`}
                                                title={isTaught ? "Clase dictada" : "Clase no dictada"}
                                            />
                                            {isTaught && (
                                                <div className="flex gap-1 mt-1">
                                                    <button
                                                        onClick={() => onSetBulkAttendance(date, 'P', students.map(s => s.id))}
                                                        className="w-5 h-5 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-sm transition-colors"
                                                        title="Marcar todos Presente"
                                                    >P</button>
                                                    <button
                                                        onClick={() => onSetBulkAttendance(date, 'A', students.map(s => s.id))}
                                                        className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-sm transition-colors"
                                                        title="Marcar todos Ausente"
                                                    >A</button>
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                )
                            })}
                            <th scope="col" className="px-4 py-3 text-center sticky right-0 bg-gray-100 dark:bg-gray-800 z-10 border-l border-gray-200 dark:border-gray-700">
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
                                <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-700">
                                        {student.lastName.toUpperCase()}, {student.firstName}
                                    </td>
                                    {classDates.map(date => {
                                        const currentStatus = getStatusForStudent(student.id, date);
                                        const session = classSessions.find(s => s.date === date);
                                        const isTaught = session ? session.taught : false;
                                        return (
                                            <td key={date} className="px-2 py-3 text-center">
                                                <div className="flex justify-center space-x-1">
                                                    {(['P', 'A', 'J'] as AttendanceStatus[]).map(status => (
                                                        <AttendanceButton
                                                            key={status}
                                                            currentStatus={currentStatus}
                                                            status={status}
                                                            onClick={() => onSetAttendance(student.id, date, status)}
                                                            disabled={!isTaught}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center font-medium sticky right-0 bg-white dark:bg-gray-900 z-10 border-l border-gray-200 dark:border-gray-700">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${percentage >= 80 ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300' :
                                                percentage >= 50 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300' :
                                                    'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
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