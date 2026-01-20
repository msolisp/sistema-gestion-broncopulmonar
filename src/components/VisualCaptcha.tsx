'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface VisualCaptchaProps {
    onCaptchaChange: (value: string, token: string) => void;
    onError?: () => void;
}

export default function VisualCaptcha({ onCaptchaChange, onError }: VisualCaptchaProps) {
    const [captchaSvg, setCaptchaSvg] = useState<string>('');
    const [captchaToken, setCaptchaToken] = useState<string>('');
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCaptcha = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/captcha');
            if (!response.ok) throw new Error('Failed to fetch CAPTCHA');

            const data = await response.json();
            setCaptchaSvg(data.svg);
            setCaptchaToken(data.token);
            setUserInput(''); // Clear input on refresh
            onCaptchaChange('', data.token); // Reset parent state
        } catch (error) {
            console.error('CAPTCHA fetch error:', error);
            if (onError) onError();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUserInput(value);
        onCaptchaChange(value, captchaToken);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Código de Seguridad
            </label>

            <div className="flex items-center gap-3">
                {/* CAPTCHA Image */}
                <div className="relative flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    {isLoading ? (
                        <div className="w-[200px] h-[80px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                        </div>
                    ) : (
                        <div
                            className="w-[200px] h-[80px]"
                            dangerouslySetInnerHTML={{ __html: captchaSvg }}
                        />
                    )}
                </div>

                {/* Refresh Button */}
                <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={isLoading}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generar nuevo código"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Input Field */}
            <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Ingresa el código"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                maxLength={6}
                autoComplete="off"
                required
            />

            <p className="text-xs text-slate-500">
                Ingresa los caracteres que ves en la imagen (no distingue mayúsculas/minúsculas)
            </p>
        </div>
    );
}
