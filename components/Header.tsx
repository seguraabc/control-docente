import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { LogoutIcon } from './icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-900 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-400">Control Docente</h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 bg-gray-800 p-1 pr-3 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
            >
              <img className="h-8 w-8 rounded-full object-cover" src={user.picture} alt="Avatar del usuario" />
              <span className="text-gray-200 font-medium hidden sm:block">{user.name}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5 border border-gray-700">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-200 font-semibold" role="none">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate" role="none">
                        {user.email}
                      </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogoutIcon />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
