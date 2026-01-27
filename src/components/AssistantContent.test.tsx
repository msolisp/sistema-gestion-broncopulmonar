import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssistantContent from './AssistantContent';
import '@testing-library/jest-dom';

// Mock components and hooks
jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('AssistantContent Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the initial greeting', () => {
        render(<AssistantContent />);
        expect(screen.getByText(/Hola, soy tu asistente clínico/i)).toBeInTheDocument();
    });

    it('displays warning when response includes internet source tag', async () => {
        const mockReader = {
            read: jest.fn()
                .mockResolvedValueOnce({ value: new TextEncoder().encode('[[INTERNET_SOURCE]]La fibrosis es...'), done: false })
                .mockResolvedValueOnce({ done: true })
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        });

        render(<AssistantContent />);

        // Trigger a prompt
        const promptBtn = screen.getByText('🤔 ¿Qué es la FPP?');
        fireEvent.click(promptBtn);

        await waitFor(() => {
            expect(screen.getByText(/Advertencia: La información generada se obtuvo desde fuentes de datos de Internet/i)).toBeInTheDocument();
        });

        // And ensure the tag is stripped from the main content
        expect(screen.getByText('La fibrosis es...')).toBeInTheDocument();
        expect(screen.queryByText('[[INTERNET_SOURCE]]')).not.toBeInTheDocument();
    });
});
