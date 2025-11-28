import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NavButton from './NavButton';
import SystemStatus from './SystemStatus';

interface HeaderProps {
  title: string;
  currentView: 'chat' | 'admin';
  onViewChange: (view: 'chat' | 'admin') => void;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentView, onViewChange, onAuthClick }) => {
  const { currentUser, logout } = useAuth();
  const isChat = currentView === 'chat';

  // Dynamic styles based on view
  const headerBg = isChat ? 'bg-transparent text-white' : 'bg-white/80 text-brand-dark border-b border-brand-grey/10';
  const navContainerBg = isChat ? 'bg-brand-purple/30 border-brand-purple/20' : 'bg-brand-grey/10 border-brand-grey/20';
  const welcomeTextColor = isChat ? 'text-brand-grey' : 'text-brand-grey';

  // Determine inactive button styles based on the current view
  const inactiveButtonClass = isChat
    ? 'text-brand-pale hover:bg-brand-purple/20'
    : 'text-brand-grey hover:text-brand-purple hover:bg-brand-purple/5';

  return (
    <header className={`sticky top-0 backdrop-blur-md px-6 py-4 flex justify-between items-center z-20 transition-colors duration-300 ${headerBg}`}>

      {/* LEFT: Logo */}
      <div className="flex items-center flex-none z-30">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${isChat ? 'bg-brand-blue shadow-brand-blue/20' : 'bg-brand-purple shadow-brand-purple/20'}`}>
          <img src={isChat ? "/va_logo.svg" : "/va_logo_light.svg"} alt="VA Logo" className="w-10 h-10 object-contain" />
        </div>
      </div>

      {/* CENTER: Nav Switcher (Absolute Centered) */}
      {currentUser && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <nav className={`p-1 rounded-lg flex space-x-1 border backdrop-blur-sm transition-colors duration-300 ${navContainerBg}`}>
            <NavButton
              label="Chat"
              isActive={currentView === 'chat'}
              onClick={() => onViewChange('chat')}
              inactiveClassName={inactiveButtonClass}
              data-testid="nav-chat"
            />
            <NavButton
              label="Admin Panel"
              isActive={currentView === 'admin'}
              onClick={() => onViewChange('admin')}
              inactiveClassName={inactiveButtonClass}
              data-testid="nav-admin-panel"
            />
          </nav>
        </div>
      )}

      {/* RIGHT: System Status + User Controls */}
      <div className="flex items-center space-x-6 flex-none z-30">
        {/* System Status Stack */}
        <div className="hidden md:block">
          <SystemStatus />
        </div>

        {currentUser ? (
          <div className="flex items-center space-x-3">
            <span className={`text-sm hidden lg:inline ${welcomeTextColor}`}>Welcome, {currentUser.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-brand-purple text-white rounded-md text-sm font-medium hover:bg-brand-purple/80 transition-all shadow-[0_0_10px_rgba(85,73,113,0.3)]"
              data-testid="nav-logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewChange('admin')}
              className="px-4 py-2 bg-brand-grey/20 text-brand-pale rounded-md text-sm font-medium hover:bg-brand-grey/30 transition-colors border border-brand-grey/20 backdrop-blur-sm"
              data-testid="nav-guest-admin"
            >
              Go to Admin
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 bg-brand-blue text-brand-dark rounded-md text-sm font-bold hover:bg-brand-blue/90 transition-all shadow-[0_0_15px_rgba(138,198,208,0.4)]"
              data-testid="nav-auth-button"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;