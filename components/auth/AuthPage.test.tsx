import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthPage from './AuthPage';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../constants';

vi.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as vi.Mock;

describe('AuthPage', () => {
    const mockLogin = vi.fn();
    const mockSignUp = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            signUp: mockSignUp,
        });
    });

    it('renders the Sign In form by default', () => {
        render(<AuthPage onClose={mockOnClose} />);
        expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
    });

    it('switches to the Sign Up form', async () => {
        const user = userEvent.setup();
        render(<AuthPage onClose={mockOnClose} />);
        
        await user.click(screen.getByRole('button', { name: 'Sign Up' }));
        
        expect(screen.getByRole('heading', { name: 'Create Your Account' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    });

    it('submits the sign in form with correct credentials', async () => {
        const user = userEvent.setup();
        render(<AuthPage onClose={mockOnClose} />);

        await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/Password/i), 'password123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('submits the sign up form with correct credentials', async () => {
        const user = userEvent.setup();
        render(<AuthPage onClose={mockOnClose} />);
        
        await user.click(screen.getByRole('button', { name: 'Sign Up' }));

        await user.type(screen.getByLabelText(/Name/i), 'Test User');
        await user.type(screen.getByLabelText(/Email Address/i), 'new@example.com');
        await user.type(screen.getByLabelText(/Password/i), 'newpassword');
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith('Test User', 'new@example.com', 'newpassword');
        });
    });
    
    it('shows an error message on failed login', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        const user = userEvent.setup();
        render(<AuthPage onClose={mockOnClose} />);

        await user.type(screen.getByLabelText(/Email Address/i), 'wrong@example.com');
        await user.type(screen.getByLabelText(/Password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));
        
        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('closes the modal when the close button is clicked', async () => {
        const user = userEvent.setup();
        render(<AuthPage onClose={mockOnClose} />);
        
        await user.click(screen.getByLabelText('Close authentication modal'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
