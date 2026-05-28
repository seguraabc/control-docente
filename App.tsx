import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Course, User, Student, AttendanceRecord, AttendanceStatus, ClassSession, EvaluationInstance, Grade, SemesterDates, AppData } from './types';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseModal from './components/CourseModal';
import CourseDetail from './components/CourseDetail';
import SemesterSettingsModal from './components/SemesterSettingsModal';
import ConfigurationNeededScreen from './components/ConfigurationNeededScreen';
import CsvImporter from './components/CsvImporter';
import { initGoogleClient, handleSignIn, handleSignOut, getSpreadsheetData, saveSpreadsheetData } from './services/googleSheetsService';
import { GOOGLE_CONFIG } from './config';
import { FullLogo } from './components/Logo';

type Theme = 'light' | 'dark';
type ColorTheme = 'blue' | 'green' | 'red' | 'yellow';

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);
    return () => clearTimeout(handler);
  }, [effect, delay]);
};

const App: React.FC = () => {
  if (!GOOGLE_CONFIG.API_KEY || !GOOGLE_CONFIG.CLIENT_ID) {
    return <ConfigurationNeededScreen />;
  }

  const [theme, setTheme] = useState<Theme>(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as Theme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    return (localStorage.getItem('colorTheme') as ColorTheme) || 'blue';
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('fontSize')) || 16;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('google_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleClientReady, setIsGoogleClientReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const setCourses = (updater: React.SetStateAction<Course[]>) => setAppData(prev => prev ? { ...prev, courses: typeof updater === 'function' ? updater(prev.courses) : updater } : null);
  const setStudents = (updater: React.SetStateAction<Student[]>) => setAppData(prev => prev ? { ...prev, students: typeof updater === 'function' ? updater(prev.students) : updater } : null);
  const setAttendance = (updater: React.SetStateAction<AttendanceRecord[]>) => setAppData(prev => prev ? { ...prev, attendance: typeof updater === 'function' ? updater(prev.attendance) : updater } : null);
  const setClassSessions = (updater: React.SetStateAction<ClassSession[]>) => setAppData(prev => prev ? { ...prev, classSessions: typeof updater === 'function' ? updater(prev.classSessions) : updater } : null);
  const setEvaluationInstances = (updater: React.SetStateAction<EvaluationInstance[]>) => setAppData(prev => prev ? { ...prev, evaluationInstances: typeof updater === 'function' ? updater(prev.evaluationInstances) : updater } : null);
  const setGrades = (updater: React.SetStateAction<Grade[]>) => setAppData(prev => prev ? { ...prev, grades: typeof updater === 'function' ? updater(prev.grades) : updater } : null);
  const setSemesterDates = (updater: React.SetStateAction<SemesterDates | null>) => setAppData(prev => prev ? { ...prev, semesterDates: typeof updater === 'function' ? updater(prev.semesterDates) : updater } : null);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [hasUnsyncedData, setHasUnsyncedData] = useState(() => {
    return !!localStorage.getItem('unsynced_app_data');
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        await initGoogleClient((authUser) => {
          if (authUser) {
            setUser(authUser);
            localStorage.setItem('google_auth_user', JSON.stringify(authUser));
            loadData();
          } else {
            setIsLoading(false);
          }
        });
        setIsGoogleClientReady(true);

        if (localStorage.getItem('google_auth_user')) {
          loadData();
        }
      } catch (error: any) {
        console.error("Error al inicializar cliente de Google:", error);
        setInitializationError("No se pudo conectar con los servicios de Google.");
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.page === 'course-detail' && event.state?.courseId) {
        setSelectedCourseId(event.state.courseId);
      } else {
        setSelectedCourseId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (window.history.state?.page === 'course-detail' && window.history.state?.courseId) {
      setSelectedCourseId(window.history.state.courseId);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogout = () => {
    handleSignOut();
    setUser(null);
    setAppData(null);
    setSelectedCourseId(null);
    localStorage.removeItem('google_auth_user');
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSpreadsheetData();
      setAppData(data);
    } catch (error) {
      console.error("Error al cargar los datos de la hoja de cálculo", error);
      // Forzamos el cierre de sesión si falla la validación del token silencioso en móviles
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSave = useCallback(() => {
    if (appData) {
      setIsSaving(true);
      saveSpreadsheetData(appData).then(() => {
        setTimeout(() => setIsSaving(false), 1000);
        setHasUnsyncedData(false);
      }).catch((err) => {
        setIsSaving(false);
        setHasUnsyncedData(true);
      });
    }
  }, [appData]);

  useDebouncedEffect(debouncedSave, [appData], 1500);

  const handleLogin = () => handleSignIn();

  const handleSelectCourse = useCallback((courseId: string) => {
    history.pushState({ page: 'course-detail', courseId }, '', window.location.href);
    setSelectedCourseId(courseId);
  }, []);
  const handleBackToDashboard = useCallback(() => {
    history.back();
  }, []);
  const handleOpenCreateModal = useCallback(() => { setEditingCourse(null); setIsModalOpen(true); }, []);
  const handleOpenEditModal = useCallback((course: Course) => { setEditingCourse(course); setIsModalOpen(true); }, []);
  const handleCloseModal = useCallback(() => { setIsModalOpen(false); setEditingCourse(null); }, []);
  const handleOpenSemesterModal = useCallback(() => setIsSemesterModalOpen(true), []);
  const handleCloseSemesterModal = useCallback(() => setIsSemesterModalOpen(false), []);
  const handleSaveSemesterDates = useCallback((dates: SemesterDates) => { setSemesterDates(dates); handleCloseSemesterModal(); }, [handleCloseSemesterModal]);

  const handleOpenImportModal = useCallback(() => setIsImportModalOpen(true), []);
  const handleCloseImportModal = useCallback(() => setIsImportModalOpen(false), []);
  const handleImportComplete = useCallback((importedData: Partial<AppData>) => {
      setAppData(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              courses: importedData.courses || prev.courses,
              students: importedData.students || prev.students,
              attendance: importedData.attendance || prev.attendance,
              classSessions: importedData.classSessions || prev.classSessions,
              evaluationInstances: importedData.evaluationInstances || prev.evaluationInstances,
              grades: importedData.grades || prev.grades,
          };
      });
      setIsImportModalOpen(false);
  }, []);

  const handleSaveCourse = useCallback((courseToSave: Omit<Course, 'id' | 'status'>) => {
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...editingCourse, ...courseToSave } : c));
    } else {
      const newCourse: Course = { id: `c${Date.now()}`, status: 'activo', ...courseToSave };
      setCourses(prev => [...prev, newCourse]);
    }
    handleCloseModal();
  }, [editingCourse, handleCloseModal]);

  const handleArchiveCourse = useCallback((courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: c.status === 'activo' ? 'archivado' : 'activo' } : c));
  }, []);

  const handleDeleteCourse = useCallback((courseId: string) => {
    setAppData(prev => {
      if (!prev) return prev;

      const studentsToDelete = prev.students.filter(s => s.courseId === courseId).map(s => s.id);

      return {
        ...prev,
        courses: prev.courses.filter(c => c.id !== courseId),
        students: prev.students.filter(s => s.courseId !== courseId),
        classSessions: prev.classSessions.filter(cs => cs.courseId !== courseId),
        evaluationInstances: prev.evaluationInstances.filter(ei => ei.courseId !== courseId),
        attendance: prev.attendance.filter(a => !studentsToDelete.includes(a.studentId)),
        grades: prev.grades.filter(g => !studentsToDelete.includes(g.studentId)),
      };
    });
  }, []);

  const handleAddStudent = useCallback((studentData: Omit<Student, 'id' | 'courseId'>) => {
    if (!selectedCourseId) return;
    const newStudent: Student = { id: `s${Date.now()}`, courseId: selectedCourseId, ...studentData };
    setStudents(prev => [...prev, newStudent]);
  }, [selectedCourseId]);

  const handleAddMultipleStudents = useCallback((studentsData: Omit<Student, 'id' | 'courseId'>[]) => {
    if (!selectedCourseId) return;
    const newStudents: Student[] = studentsData.map((studentData, index) => ({
      id: `s${Date.now() + index}`,
      courseId: selectedCourseId,
      ...studentData
    }));
    setStudents(prev => [...prev, ...newStudents]);
  }, [selectedCourseId]);

  const handleEditStudent = useCallback((studentId: string, firstName: string, lastName: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, firstName, lastName } : s));
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setAttendance(prev => prev.filter(a => a.studentId !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
  }, []);

  const handleSetAttendance = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const recordIndex = prev.findIndex(a => a.studentId === studentId && a.date === date);
      if (recordIndex > -1) {
        const updatedRecord = { ...prev[recordIndex], status };
        return [...prev.slice(0, recordIndex), updatedRecord, ...prev.slice(recordIndex + 1)];
      } else {
        return [...prev, { studentId, date, status }];
      }
    });
  }, []);

  const handleSetBulkAttendance = useCallback((date: string, status: AttendanceStatus, studentIds: string[]) => {
    setAttendance(prev => {
      const newAttendance = [...prev];
      studentIds.forEach(studentId => {
        const recordIndex = newAttendance.findIndex(a => a.studentId === studentId && a.date === date);
        if (recordIndex > -1) {
          newAttendance[recordIndex] = { ...newAttendance[recordIndex], status };
        } else {
          newAttendance.push({ studentId, date, status });
        }
      });
      return newAttendance;
    });
  }, []);

  const handleToggleClassSession = useCallback((date: string) => {
    if (!selectedCourseId) return;
    setClassSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.courseId === selectedCourseId && s.date === date);
      if (sessionIndex > -1) {
        const updatedSession = { ...prev[sessionIndex], taught: !prev[sessionIndex].taught };
        return [...prev.slice(0, sessionIndex), updatedSession, ...prev.slice(sessionIndex + 1)];
      } else {
        return [...prev, { courseId: selectedCourseId, date, taught: true }];
      }
    });
  }, [selectedCourseId]);

  const handleAddEvaluationInstance = useCallback((name: string) => {
    if (!selectedCourseId) return;
    setEvaluationInstances(prev => {
      const courseInstances = prev.filter(inst => inst.courseId === selectedCourseId);
      const newInstance: EvaluationInstance = { id: `ev${Date.now()}`, courseId: selectedCourseId, name, order: courseInstances.length };
      return [...prev, newInstance];
    });
  }, [selectedCourseId]);

  const handleUpdateEvaluationOrder = useCallback((updatedInstances: EvaluationInstance[]) => {
    if (!selectedCourseId) return;
    setEvaluationInstances(prev => {
      const otherCourseInstances = prev.filter(inst => inst.courseId !== selectedCourseId);
      return [...otherCourseInstances, ...updatedInstances];
    });
  }, [selectedCourseId]);

  const handleDeleteEvaluationInstance = useCallback((instanceId: string) => {
    if (!selectedCourseId) return;
    setEvaluationInstances(prev => prev.filter(inst => inst.id !== instanceId));
    setGrades(prev => prev.filter(g => g.evaluationInstanceId !== instanceId));
  }, [selectedCourseId]);

  const handleEditEvaluationInstanceName = useCallback((instanceId: string, newName: string) => {
    if (!selectedCourseId) return;
    setEvaluationInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, name: newName } : inst
    ));
  }, [selectedCourseId]);

  const handleSetGrade = useCallback((studentId: string, evaluationInstanceId: string, value: string) => {
    setGrades(prev => {
      const gradeIndex = prev.findIndex(g => g.studentId === studentId && g.evaluationInstanceId === evaluationInstanceId);
      if (gradeIndex > -1) {
        if (value === '') { return [...prev.slice(0, gradeIndex), ...prev.slice(gradeIndex + 1)]; }
        const updatedGrade = { ...prev[gradeIndex], value };
        return [...prev.slice(0, gradeIndex), updatedGrade, ...prev.slice(gradeIndex + 1)];
      } else if (value !== '') {
        return [...prev, { studentId, evaluationInstanceId, value }];
      }
      return prev;
    });
  }, []);

  const selectedCourse = useMemo(() =>
    selectedCourseId && appData ? appData.courses.find(c => c.id === selectedCourseId) : null,
    [selectedCourseId, appData]
  );

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center p-4">
        <FullLogo className="w-auto h-32 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Inicializando y conectando con Google...</p>
        <div className="mt-4 border-4 border-gray-300 dark:border-gray-700 border-t-indigo-500 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  if (initializationError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Error de Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">{initializationError}</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} isReady={isGoogleClientReady} />;
  }

  if (!appData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="mt-4 border-4 border-gray-300 dark:border-gray-700 border-t-indigo-500 rounded-full w-8 h-8 animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Cargando datos del usuario...</p>

        {/* Salida de emergencia para celulares que bloquean la renovación del token */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
        >
          ¿Demora mucho? Cerrar sesión y reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-200 font-sans">
      <Header
        user={user}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
        colorTheme={colorTheme}
        setColorTheme={setColorTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-green-600/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          Guardando...
        </div>
      )}
      {hasUnsyncedData && !isSaving && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm font-medium z-40">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Datos sin sincronizar. Los cambios se guardaron localmente y se enviarán al reconectar.
        </div>
      )}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
        {!selectedCourse ? (
          <Dashboard
            courses={appData.courses}
            onAddCourse={handleOpenCreateModal}
            onEditCourse={handleOpenEditModal}
            onArchiveCourse={handleArchiveCourse}
            onSelectCourse={handleSelectCourse}
            onOpenSemesterModal={handleOpenSemesterModal}
            onDeleteCourse={handleDeleteCourse}
            onOpenImportModal={handleOpenImportModal}
          />
        ) : (
          <CourseDetail
            course={selectedCourse}
            students={appData.students.filter(s => s.courseId === selectedCourse.id)}
            attendance={appData.attendance}
            classSessions={appData.classSessions.filter(cs => cs.courseId === selectedCourse.id)}
            evaluationInstances={appData.evaluationInstances.filter(ei => ei.courseId === selectedCourse.id)}
            grades={appData.grades}
            semesterDates={appData.semesterDates}
            onBack={handleBackToDashboard}
            onAddStudent={handleAddStudent}
            onAddMultipleStudents={handleAddMultipleStudents}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onSetAttendance={handleSetAttendance}
            onSetBulkAttendance={handleSetBulkAttendance}
            onToggleClassSession={handleToggleClassSession}
            onAddEvaluationInstance={handleAddEvaluationInstance}
            onUpdateEvaluationOrder={handleUpdateEvaluationOrder}
            onSetGrade={handleSetGrade}
            onDeleteEvaluationInstance={handleDeleteEvaluationInstance}
            onEditEvaluationInstanceName={handleEditEvaluationInstanceName}
          />
        )}
      </main>

      <footer className="py-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        Desarrollado por NODO [Soluciones digitales]- 2026
      </footer>

      {isModalOpen && (
        <CourseModal course={editingCourse} onClose={handleCloseModal} onSave={handleSaveCourse} />
      )}
      {isSemesterModalOpen && (
        <SemesterSettingsModal currentDates={appData.semesterDates} onClose={handleCloseSemesterModal} onSave={handleSaveSemesterDates} />
      )}
      {isImportModalOpen && (
        <CsvImporter onCancel={handleCloseImportModal} onImportComplete={handleImportComplete} />
      )}
    </div>
  );
};

export default App;