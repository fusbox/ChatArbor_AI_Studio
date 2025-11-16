import React, { useState } from 'react';
import Header from './components/shared/Header';
import ChatWindow from './components/chat/ChatWindow';
import AdminDashboard from './components/admin/AdminDashboard';
import { APP_NAME } from './constants';
import AuthPage from './components/auth/AuthPage';

type View = 'chat' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen font-sans text-neutral-800">
      <Header 
        title={APP_NAME} 
        currentView={view} 
        onViewChange={setView}
        onAuthClick={() => setAuthModalOpen(true)}
      />
      <main className="flex-1">
        {view === 'chat' ? <ChatWindow /> : <AdminDashboard />}
      </main>
      {isAuthModalOpen && (
        <AuthPage onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
};

export default App;