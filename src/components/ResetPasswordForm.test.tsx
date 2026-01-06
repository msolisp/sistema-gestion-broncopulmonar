import { render, screen } from '@testing-library/react';
import ResetPasswordForm from './ResetPasswordForm';
import { useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock React
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: jest.fn(),
}));

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

describe('ResetPasswordForm', () => {
    const mockRouter = { push: jest.fn() };
    const mockSearchParams = { get: jest.fn() };
    const mockAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (useActionState as jest.Mock).mockReturnValue([null, mockAction, false]);
    });

    it('renders error when token is missing', () => {
        mockSearchParams.get.mockReturnValue(null);
        render(<ResetPasswordForm />);
        expect(screen.getByText('Token inválido o faltante. Por favor solicita un nuevo enlace.')).toBeInTheDocument();
    });

    it('renders form when token is present', () => {
        mockSearchParams.get.mockReturnValue('valid-token');
        render(<ResetPasswordForm />);
        expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument();
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
    });

    it('shows success state', () => {
        mockSearchParams.get.mockReturnValue('valid-token');
        (useActionState as jest.Mock).mockReturnValue([{ success: true, message: 'Password Reset' }, mockAction, false]);

        render(<ResetPasswordForm />);
        expect(screen.getByText('Password Reset')).toBeInTheDocument();
    });

    it('redirects on success', () => {
        mockSearchParams.get.mockReturnValue('valid-token');
        (useActionState as jest.Mock).mockReturnValue([{ success: true }, mockAction, false]);

        jest.useFakeTimers();
        render(<ResetPasswordForm />);

        jest.advanceTimersByTime(3000);
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
        jest.useRealTimers();
    });
});
