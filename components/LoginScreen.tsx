import React from 'react';
import { GoogleIcon } from './icons';
import { FullLogo } from './Logo';

interface LoginScreenProps {
  onLogin: () => void;
  isReady: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isReady }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <header className="mb-8 flex flex-col items-center">
          <FullLogo className="w-auto h-40" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            Gestiona tus cursos de forma sencilla y segura.
          </p>
        </header>
        
        <main className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
           <p className="text-gray-700 dark:text-gray-300 mb-6">
            Inicia sesión con tu cuenta de Google para guardar tus datos de forma segura en una hoja de cálculo personal en tu Google Drive.
          </p>
          <button
            onClick={onLogin}
            disabled={!isReady}
            className="w-full text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-3 text-center inline-flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
          >
            <GoogleIcon />
            {isReady ? 'Iniciar sesión con Google' : 'Cargando...'}
          </button>
        </main>

        <footer className="mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-600">
                Al iniciar sesión, autorizas a la aplicación a crear y gestionar el archivo "ControlDocente_Datos" en tu Google Drive.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;