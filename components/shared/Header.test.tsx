import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext');

const mockUseAuth = vi.mocked(useAuth);
const createAuthValue = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
    currentUser: null,
    isLoading: false,
    login: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    ...overrides,
});

const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password'
};

describe('Header', () => {

    const onViewChange = vi.fn();
    const onAuthClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly for a guest user', () => {
        mockUseAuth.mockReturnValue(createAuthValue({ currentUser: null }));
        render(<Header title="Test App" currentView="chat" onViewChange={onViewChange} onAuthClick={onAuthClick} />);
        
        expect(screen.getByText('Test App')).toBeInTheDocument();
        expect(screen.getByText('Go to Admin')).toBeInTheDocument();
        expect(screen.getByText('Sign In / Sign Up')).toBeInTheDocument();
        
        // Ensure admin navigation is not present for guests
        expect(screen.queryByText('Chat')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });

    it('renders correctly for a logged-in user', () => {
        mockUseAuth.mockReturnValue(createAuthValue({ currentUser: mockUser }));
        render(<Header title="Test App" currentView="chat" onViewChange={onViewChange} onAuthClick={onAuthClick} />);

        expect(screen.getByText('Test App')).toBeInTheDocument();
        expect(screen.getByText(`Welcome, ${mockUser.name}`)).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        
        // Ensure authenticated navigation is present
        expect(screen.getByText('Chat')).toBeInTheDocument();
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();

        // Ensure guest buttons are not present
        expect(screen.queryByText('Sign In / Sign Up')).not.toBeInTheDocument();
    });

    it('calls onViewChange when navigation buttons are clicked', () => {
        mockUseAuth.mockReturnValue(createAuthValue({ currentUser: mockUser }));
        render(<Header title="Test App" currentView="chat" onViewChange={onViewChange} onAuthClick={onAuthClick} />);

        fireEvent.click(screen.getByText('Admin Panel'));
        expect(onViewChange).toHaveBeenCalledWith('admin');

        fireEvent.click(screen.getByText('Chat'));
        expect(onViewChange).toHaveBeenCalledWith('chat');
    });

    it('calls onAuthClick when "Sign In" button is clicked for guest user', () => {
        mockUseAuth.mockReturnValue(createAuthValue({ currentUser: null }));
        render(<Header title="Test App" currentView="chat" onViewChange={onViewChange} onAuthClick={onAuthClick} />);

        fireEvent.click(screen.getByText('Sign In / Sign Up'));
        expect(onAuthClick).toHaveBeenCalledTimes(1);
    });

    it('calls logout function when "Logout" button is clicked', () => {
        const mockLogout = vi.fn();
        mockUseAuth.mockReturnValue(createAuthValue({ currentUser: mockUser, logout: mockLogout }));
        render(<Header title="Test App" currentView="chat" onViewChange={onViewChange} onAuthClick={onAuthClick} />);
        
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});
