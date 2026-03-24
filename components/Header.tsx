import React from 'react';
import { User } from '../types';
import { SunIcon, MoonIcon, LogoutIcon } from './icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  colorTheme: 'blue' | 'green' | 'red' | 'yellow';
  setColorTheme: (color: 'blue' | 'green' | 'red' | 'yellow') => void;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, setTheme, colorTheme, setColorTheme, fontSize, setFontSize }) => {

  const handleDecreaseFont = () => {
    setFontSize(prev => Math.max(12, prev - 2));
  };

  const handleIncreaseFont = () => {
    setFontSize(prev => Math.min(24, prev + 2));
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              Control Docente
            </h2>
          </div>

          <div className="flex items-center gap-4">

            {/* Accesibilidad: Controles de Tamaño de Fuente */}
            <div className="hidden sm:flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-4 mr-1">
              <button
                onClick={handleDecreaseFont}
                disabled={fontSize <= 12}
                className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Reducir tamaño de letra"
                aria-label="Reducir texto"
              >
                A-
              </button>
              <button
                onClick={handleIncreaseFont}
                disabled={fontSize >= 24}
                className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Aumentar tamaño de letra"
                aria-label="Aumentar texto"
              >
                A+
              </button>
            </div>

            {/* Selector de Skins de Color */}
            <div className="hidden sm:flex items-center gap-2 mr-2 pr-4 border-r border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setColorTheme('blue')}
                className={`w-5 h-5 rounded-full bg-[#6366f1] transition-transform hover:scale-110 ${colorTheme === 'blue' ? 'ring-2 ring-offset-2 ring-[#6366f1] dark:ring-offset-gray-900 scale-110' : ''}`}
                title="Tema Azul"
              />
              <button
                onClick={() => setColorTheme('green')}
                className={`w-5 h-5 rounded-full bg-[#10b981] transition-transform hover:scale-110 ${colorTheme === 'green' ? 'ring-2 ring-offset-2 ring-[#10b981] dark:ring-offset-gray-900 scale-110' : ''}`}
                title="Tema Verde"
              />
              <button
                onClick={() => setColorTheme('red')}
                className={`w-5 h-5 rounded-full bg-[#f43f5e] transition-transform hover:scale-110 ${colorTheme === 'red' ? 'ring-2 ring-offset-2 ring-[#f43f5e] dark:ring-offset-gray-900 scale-110' : ''}`}
                title="Tema Rojo"
              />
              <button
                onClick={() => setColorTheme('yellow')}
                className={`w-5 h-5 rounded-full bg-[#f59e0b] transition-transform hover:scale-110 ${colorTheme === 'yellow' ? 'ring-2 ring-offset-2 ring-[#f59e0b] dark:ring-offset-gray-900 scale-110' : ''}`}
                title="Tema Maíz"
              />
            </div>

            {/* Toggle Dark Mode */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Alternar modo oscuro"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
              </div>
              <img
                src={user.picture}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={onLogout}
                className="p-2 ml-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Cerrar Sesión"
              >
                <LogoutIcon />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;