
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { authenticate } from '@/lib/actions';

// Mock next navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

// Mock server actions
jest.mock('@/lib/actions', () => ({
    authenticate: jest.fn(),
}));

// Mock useFormStatus
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    useFormStatus: () => ({ pending: false }),
}));

describe('LoginPage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the login form correctly', () => {
            render(<LoginPage />);

            expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
            expect(screen.getByText(/ingresa a tu cuenta para continuar/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
        });

        it('should render the register link', () => {
            render(<LoginPage />);

            const registerLink = screen.getByRole('link', { name: /regístrate/i });
            expect(registerLink).toBeInTheDocument();
            expect(registerLink).toHaveAttribute('href', '/register');
        });

        it('should have email input with correct attributes', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            expect(emailInput).toHaveAttribute('type', 'email');
            expect(emailInput).toHaveAttribute('name', 'email');
            expect(emailInput).toHaveAttribute('required');
            expect(emailInput).toHaveAttribute('placeholder', 'm@example.com');
        });

        it('should have password input with correct attributes', () => {
            render(<LoginPage />);

            const passwordInput = screen.getByLabelText(/contraseña/i);
            expect(passwordInput).toHaveAttribute('type', 'password');
            expect(passwordInput).toHaveAttribute('name', 'password');
            expect(passwordInput).toHaveAttribute('required');
        });
    });

    describe('Mobile Optimization', () => {
        it('should have text-base size for mobile (prevents auto-zoom on iOS)', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/contraseña/i);

            // Check for text-base class which translates to 16px
            expect(emailInput.className).toContain('text-base');
            expect(passwordInput.className).toContain('text-base');
        });

        it('should have py-3 for good touch target height', () => {
            render(<LoginPage />);

            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            // Check for py-3 class for proper touch target
            expect(submitButton.className).toContain('py-3');
        });

        it('should have full width for inputs on mobile', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/contraseña/i);

            expect(emailInput.className).toContain('w-full');
            expect(passwordInput.className).toContain('w-full');
        });
    });

    describe('Form Interaction', () => {
        it('should allow typing in email field', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            expect(emailInput.value).toBe('test@example.com');
        });

        it('should allow typing in password field', () => {
            render(<LoginPage />);

            const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
            fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

            expect(passwordInput.value).toBe('Password123!');
        });

        it('should display error message when authentication fails', async () => {
            const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
            mockAuthenticate.mockResolvedValue('Credenciales inválidas.');

            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/contraseña/i);
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper labels for all inputs', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/contraseña/i);

            expect(emailInput).toHaveAccessibleName();
            expect(passwordInput).toHaveAccessibleName();
        });

        it('should have submit button with proper type', () => {
            render(<LoginPage />);

            const submitButton = screen.getByRole('button', { name: /ingresar/i });
            expect(submitButton).toHaveAttribute('type', 'submit');
        });

        it('should have disabled state with proper cursor style', () => {
            render(<LoginPage />);

            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            // Check for disabled cursor class
            expect(submitButton.className).toContain('disabled:cursor-not-allowed');
        });
    });

    describe('Visual Feedback', () => {
        it('should have focus ring styles for inputs', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);

            // Check for focus styles
            expect(emailInput.className).toContain('focus:ring-2');
            expect(emailInput.className).toContain('focus:ring-indigo-500');
        });

        it('should have transition classes for smooth interactions', () => {
            render(<LoginPage />);

            const emailInput = screen.getByLabelText(/email/i);
            const submitButton = screen.getByRole('button', { name: /ingresar/i });

            expect(emailInput.className).toContain('transition-all');
            expect(submitButton.className).toContain('transition-colors');
        });
    });
});
