import React, { useState, useRef, useEffect } from 'react';
import { Course } from '../types';
import { BookOpenIcon, DotsVerticalIcon, PencilIcon, ArchiveIcon, UnarchiveIcon } from './icons';

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onArchive: (id: string) => void;
  onSelect: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit, onArchive, onSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(!menuOpen);
  }

  const isArchived = course.status === 'archivado';
  const statusBgColor = isArchived ? 'bg-yellow-800' : 'bg-green-800';
  const statusTextColor = isArchived ? 'text-yellow-200' : 'text-green-200';
  const cardBorderColor = isArchived ? 'border-gray-700' : 'border-indigo-500';

  return (
    <div 
        className={`bg-gray-900/50 rounded-lg shadow-lg border-t-4 ${cardBorderColor} flex flex-col transition-all duration-300 hover:shadow-indigo-500/30 hover:scale-[1.02] cursor-pointer`}
        onClick={() => onSelect(course.id)}
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-3">
            <div className="bg-gray-800 p-2 rounded-full mr-3">
              <BookOpenIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-100">{course.name}</h3>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
              aria-label="Opciones del curso"
            >
              <DotsVerticalIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-xl z-10 border border-gray-700">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(course); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center rounded-t-md"
                >
                  <PencilIcon /> Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(course.id); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center rounded-b-md"
                >
                  {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
                  {isArchived ? 'Desarchivar' : 'Archivar'}
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-400 mb-4">{course.schedule}</p>
      </div>
      <div className="bg-gray-800/50 px-5 py-2 rounded-b-lg">
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusBgColor} ${statusTextColor} uppercase`}>
          {course.status}
        </span>
      </div>
    </div>
  );
};

export default CourseCard;
