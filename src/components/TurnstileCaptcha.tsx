'use client'

import Turnstile from 'react-turnstile'

interface TurnstileCaptchaProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
}

export default function TurnstileCaptcha({ onVerify, onError, onExpire }: TurnstileCaptchaProps) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        console.warn('Turnstile Site Key missing');
        return null;
    }

    return (
        <div className="w-full flex justify-center my-4">
            <Turnstile
                sitekey={siteKey}
                onVerify={onVerify}
                onError={onError}
                onExpire={onExpire}
                theme="light"
            />
        </div>
    )
}
