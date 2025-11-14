import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../shared/Spinner';
import { APP_NAME } from '../../constants';

type AuthMode = 'signin' | 'signup';

interface AuthPageProps {
  onClose: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onClose }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signUp(name, email, password);
      }
      onClose(); // Close modal on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-700 p-1 rounded-full transition-colors"
          aria-label="Close authentication modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">{mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}</h2>
          <p className="text-neutral-500 text-sm mt-1">to {APP_NAME}</p>
        </div>

        <div className="flex mb-6 border-b">
          <button onClick={() => switchMode('signin')} className={`flex-1 pb-2 text-center text-sm font-medium ${mode === 'signin' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500'}`}>
            Sign In
          </button>
          <button onClick={() => switchMode('signup')} className={`flex-1 pb-2 text-center text-sm font-medium ${mode === 'signup' ? 'border-b-2 border-primary text-primary' : 'text-neutral-500'}`}>
            Sign Up
          </button>
        </div>

        {error && <p className="bg-red-100 text-red-700 text-sm p-3 rounded-lg mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700">Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">Email Address</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-neutral-700">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full p-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400 flex items-center justify-center">
            {isSubmitting && <Spinner />}
            <span className="ml-2">{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;