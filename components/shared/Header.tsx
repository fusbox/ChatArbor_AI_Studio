import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  currentView: 'chat' | 'admin';
  onViewChange: (view: 'chat' | 'admin') => void;
  onAuthClick: () => void;
}

const NavButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white shadow'
                : 'text-neutral-100 hover:bg-primary-dark'
        }`}
    >
        {label}
    </button>
);


const Header: React.FC<HeaderProps> = ({ title, currentView, onViewChange, onAuthClick }) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-primary-dark text-white shadow-md p-4 flex justify-between items-center z-10">
      <div className="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>
      
      {currentUser ? (
        <div className="flex items-center space-x-4">
          <nav className="bg-primary-dark/50 p-1 rounded-lg flex space-x-1">
            <NavButton label="Chat" isActive={currentView === 'chat'} onClick={() => onViewChange('chat')} />
            <NavButton label="Admin Panel" isActive={currentView === 'admin'} onClick={() => onViewChange('admin')} />
          </nav>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-200">Welcome, {currentUser.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-accent text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
         <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewChange('admin')}
              className="px-4 py-2 bg-neutral-600 text-white rounded-md text-sm font-medium hover:bg-neutral-700 transition-colors"
            >
              Go to Admin
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 bg-secondary text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Sign In / Sign Up
            </button>
        </div>
      )}
    </header>
  );
};

export default Header;