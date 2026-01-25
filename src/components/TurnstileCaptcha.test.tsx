
import { render, screen } from '@testing-library/react';
import TurnstileCaptcha from './TurnstileCaptcha';

jest.mock('react-turnstile', () => () => <div data-testid="turnstile">Turnstile</div>);

describe('TurnstileCaptcha', () => {
    it('renders null if siteKey missing', () => {
        render(<TurnstileCaptcha onVerify={jest.fn()} />);
        expect(screen.queryByTestId('turnstile')).not.toBeInTheDocument();
    });

    it('renders if siteKey present', () => {
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test_key';
        render(<TurnstileCaptcha onVerify={jest.fn()} />);
        expect(screen.getByTestId('turnstile')).toBeInTheDocument();
    });
});
