import React from 'react';
import { UserRole } from '../types';
import { LogOut, LayoutDashboard, UserCircle } from 'lucide-react';

interface NavbarProps {
  userRole: UserRole;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout }) => {
  return (
    <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <img src="/favicon.jpeg" alt="EasyConnect Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold tracking-tight">EasyConnect</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-indigo-700 px-3 py-1 rounded-full text-sm">
              <UserCircle className="h-4 w-4" />
              <span>{userRole === UserRole.STUDENT ? 'Student View' : 'Faculty View'}</span>
            </div>
            
            <button 
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-indigo-500 transition-colors flex items-center space-x-1"
              title="Switch Role / Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
