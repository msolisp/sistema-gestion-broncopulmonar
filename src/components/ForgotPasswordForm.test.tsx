import { render, screen, fireEvent } from '@testing-library/react';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useActionState } from 'react';

// Mock React's useActionState
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: jest.fn(),
}));

describe('ForgotPasswordForm', () => {
    const mockAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useActionState as jest.Mock).mockReturnValue([null, mockAction, false]);
    });

    it('renders the form correctly', () => {
        render(<ForgotPasswordForm />);
        expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
        expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar Instrucciones' })).toBeInTheDocument();
    });

    it('shows success message when state has one', () => {
        (useActionState as jest.Mock).mockReturnValue([{ message: 'Success' }, mockAction, false]);
        render(<ForgotPasswordForm />);
        expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('disables button when pending', () => {
        (useActionState as jest.Mock).mockReturnValue([null, mockAction, true]);
        render(<ForgotPasswordForm />);
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });
});
