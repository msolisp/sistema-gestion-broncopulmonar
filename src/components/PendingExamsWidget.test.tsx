
import { render, screen, fireEvent } from '@testing-library/react';
import PendingExamsWidget from './PendingExamsWidget';
import { reviewMedicalExam } from '@/lib/actions';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('@/lib/actions', () => ({
    reviewMedicalExam: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

const mockRouter = { refresh: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(mockRouter);

const mockExams = [
    {
        id: 'exam-1',
        fileName: 'test.pdf',
        fileUrl: 'http://example.com/test.pdf',
        examDate: '2026-01-01T10:00:00Z',
        patient: {
            id: 'p-1',
            name: 'Juan Perez',
            rut: '12.345.678-9'
        }
    }
];

describe('PendingExamsWidget', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders empty state when no exams', () => {
        render(<PendingExamsWidget exams={[]} />);
        expect(screen.getByText('No hay exámenes pendientes de revisión')).toBeInTheDocument();
    });

    it('renders list of exams', () => {
        render(<PendingExamsWidget exams={mockExams} />);
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('handles mark as reviewed', async () => {
        (reviewMedicalExam as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<PendingExamsWidget exams={mockExams} />);

        const checkButton = screen.getByRole('button', { name: /Marcar Revisado/i });
        fireEvent.click(checkButton);

        expect(reviewMedicalExam).toHaveBeenCalledWith('exam-1');
        // Since it's optimistic, it might wait or just trigger. 
        // The component uses transition, so we might need waitFor.
    });
});
