import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NavButton from './NavButton';
import SystemStatus from './SystemStatus';

interface HeaderProps {
  title: string;
  currentView: 'chat' | 'admin' | 'portfolio';
  onViewChange: (view: 'chat' | 'admin' | 'portfolio') => void;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentView, onViewChange, onAuthClick }) => {
  const { currentUser, logout } = useAuth();
  const { theme, mode, setTheme, toggleMode } = useTheme();

  // Dynamic styles based on theme/mode are now handled by CSS variables + Tailwind
  // We just need to ensure the header background is appropriate
  const headerBg = 'bg-background/80 border-b border-border text-text';
  const navContainerBg = 'bg-surface/50 border-border';
  const inactiveButtonClass = 'text-text-muted hover:text-primary hover:bg-primary/10';

  return (
    <header className={`sticky top-0 backdrop-blur-md px-6 py-4 flex justify-between items-center z-20 transition-colors duration-300 ${headerBg}`}>

      {/* LEFT: Logo & Theme Controls */}
      <div className="flex items-center space-x-4 flex-none z-30">
        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-primary shadow-primary/20">
          <img
            src={theme === 'corporate'
              ? (mode === 'dark' ? "/va_logo2.svg" : "/va_logo_light2.svg")
              : (mode === 'dark' ? "/va_logo.svg" : "/va_logo_light.svg")
            }
            alt="VA Logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Theme Controls */}
        <div className="flex items-center space-x-2 bg-surface/50 rounded-lg p-1 border border-border backdrop-blur-sm">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="bg-transparent text-xs font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="mystic">🔮 Mystic</option>
            <option value="corporate">🏢 Corporate</option>
          </select>
          <div className="w-px h-4 bg-border"></div>
          <button
            onClick={toggleMode}
            className="p-1 hover:bg-primary/10 rounded-md transition-colors text-text"
            title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {mode === 'light' ? '🌙' : '☀️'}
          </button>
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
            {/* <NavButton
              label="Portfolio"
              isActive={currentView === 'portfolio'}
              onClick={() => onViewChange('portfolio')}
              inactiveClassName={inactiveButtonClass}
              data-testid="nav-portfolio"
            /> */}
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
            <span className="text-sm hidden lg:inline text-text-muted">Welcome, {currentUser.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              data-testid="nav-logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewChange('admin')}
              className="px-4 py-2 bg-surface text-text-muted rounded-md text-sm font-medium hover:bg-surface/80 transition-colors border border-border backdrop-blur-sm"
              data-testid="nav-guest-admin"
            >
              Go to Admin
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 bg-secondary text-brand-dark rounded-md text-sm font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
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