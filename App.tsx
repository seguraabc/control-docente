import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Course, User, Student, AttendanceRecord, AttendanceStatus, ClassSession, EvaluationInstance, Grade, SemesterDates, AppData } from './types';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseModal from './components/CourseModal';
import CourseDetail from './components/CourseDetail';
import SemesterSettingsModal from './components/SemesterSettingsModal';
import ConfigurationNeededScreen from './components/ConfigurationNeededScreen';
import { initGoogleClient, handleSignIn, handleSignOut, getSpreadsheetData, saveSpreadsheetData } from './services/googleSheetsService';
import { GOOGLE_CONFIG } from './config';
import { FullLogo } from './components/Logo';

type Theme = 'light' | 'dark';

// Custom Hook para ejecutar un efecto con debounce
const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);
    return () => clearTimeout(handler);
  }, [effect, delay]);
};

const App: React.FC = () => {
  // Verificación de configuración a través de variables de entorno
  if (!GOOGLE_CONFIG.API_KEY || !GOOGLE_CONFIG.CLIENT_ID) {
    return <ConfigurationNeededScreen />;
  }
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as Theme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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


  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    const initialize = async () => {
      try {
        await initGoogleClient((authUser) => {
          if (authUser) {
            setUser(authUser);
            loadData();
          } else {
            setUser(null);
            setAppData(null);
            setIsLoading(false);
          }
        });
        setIsGoogleClientReady(true);
      } catch (error: any) {
        console.error("Error al inicializar cliente de Google:", error);
        setInitializationError("No se pudo conectar con los servicios de Google. Por favor, verifica la configuración de la consola y las credenciales (API Key, Client ID).");
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // Handle URL hash for navigation and deep linking
  useEffect(() => {
    // Only run this logic if the user data is loaded
    if (!appData) return;

    const handleNavigation = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/course/')) {
        const courseId = hash.substring('#/course/'.length);
        if (appData.courses.some(c => c.id === courseId)) {
          setSelectedCourseId(courseId);
        } else {
          // If course ID from URL is invalid, go to dashboard and clean up the URL.
          setSelectedCourseId(null);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        setSelectedCourseId(null);
      }
    };
    
    // Check the URL on initial load or when data becomes available
    handleNavigation();

    // Listen for back/forward button presses
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [appData]); // Dependency on appData ensures this runs once data is loaded.

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSpreadsheetData();
      setAppData(data);
    } catch (error) {
      console.error("Error al cargar los datos de la hoja de cálculo", error);
      // Opcional: mostrar un mensaje de error al usuario
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSave = useCallback(() => {
    if (appData) {
      setIsSaving(true);
      saveSpreadsheetData(appData).then(() => {
        setTimeout(() => setIsSaving(false), 1000); // Mantiene el indicador visible un poco más
      });
    }
  }, [appData]);
  
  useDebouncedEffect(debouncedSave, [appData], 1500);

  const handleLogin = () => handleSignIn();
  const handleLogout = () => {
      handleSignOut();
      setUser(null);
      setAppData(null);
      setSelectedCourseId(null);
  };
  
  const handleSelectCourse = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
    window.history.pushState({ courseId }, ``, `#/course/${courseId}`);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedCourseId(null);
    window.history.replaceState(null, ``, window.location.pathname + window.location.search);
  }, []);
  
  const handleOpenCreateModal = useCallback(() => { setEditingCourse(null); setIsModalOpen(true); }, []);
  const handleOpenEditModal = useCallback((course: Course) => { setEditingCourse(course); setIsModalOpen(true); }, []);
  const handleCloseModal = useCallback(() => { setIsModalOpen(false); setEditingCourse(null); }, []);
  const handleOpenSemesterModal = useCallback(() => setIsSemesterModalOpen(true), []);
  const handleCloseSemesterModal = useCallback(() => setIsSemesterModalOpen(false), []);
  const handleSaveSemesterDates = useCallback((dates: SemesterDates) => { setSemesterDates(dates); handleCloseSemesterModal(); }, [handleCloseSemesterModal]);

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

  if (isLoading) {
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
         <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">Cargando datos del usuario...</p>
         </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-200 font-sans">
      <Header user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
       {isSaving && (
        <div className="fixed bottom-4 right-4 bg-green-600/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            Guardando...
        </div>
      )}
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {!selectedCourse ? (
           <Dashboard
            courses={appData.courses}
            onAddCourse={handleOpenCreateModal}
            onEditCourse={handleOpenEditModal}
            onArchiveCourse={handleArchiveCourse}
            onSelectCourse={handleSelectCourse}
            onOpenSemesterModal={handleOpenSemesterModal}
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
            onDeleteStudent={handleDeleteStudent}
            onSetAttendance={handleSetAttendance}
            onToggleClassSession={handleToggleClassSession}
            onAddEvaluationInstance={handleAddEvaluationInstance}
            onUpdateEvaluationOrder={handleUpdateEvaluationOrder}
            onSetGrade={handleSetGrade}
            onDeleteEvaluationInstance={handleDeleteEvaluationInstance}
            onEditEvaluationInstanceName={handleEditEvaluationInstanceName}
          />
        )}
      </main>
      {isModalOpen && (
        <CourseModal course={editingCourse} onClose={handleCloseModal} onSave={handleSaveCourse} />
      )}
      {isSemesterModalOpen && (
        <SemesterSettingsModal currentDates={appData.semesterDates} onClose={handleCloseSemesterModal} onSave={handleSaveSemesterDates} />
      )}
    </div>
  );
};

export default App;
