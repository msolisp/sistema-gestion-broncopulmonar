
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hola, soy tu asistente clínico especializado en Fibrosis Pulmonar. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Prompts sugeridos: Optimizados para coincidir con la guía "FPPocket" (Fibrosis Pulmonar Progresiva)
    const SUGGESTED_PROMPTS = [
        { label: '🤔 ¿Qué es la FPP?', query: '¿Qué es la fibrosis pulmonar progresiva (FPP)?', suffix: ' (Responde en máximo 5 líneas)' },
        { label: '💊 Tratamiento Farmacológico', query: '¿Cuál es el manejo farmacológico de la fibrosis pulmonar progresiva (nintedanib y pirfenidona)?', suffix: ' (Responde en máximo 5 líneas)' },
        { label: '📋 Criterios de FPP', query: '¿Cuáles son los criterios para definir una fibrosis pulmonar progresiva?', suffix: ' (Lista los criterios en máximo 5 líneas)' },
    ];

    const handleSubmit = async (e?: React.FormEvent, promptOverride?: { query: string, suffix?: string }) => {
        if (e) e.preventDefault();

        const query = promptOverride ? promptOverride.query : input.trim();
        if (!query || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setIsLoading(true);

        const apiContent = promptOverride?.suffix ? `${query} ${promptOverride.suffix}` : query;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, { role: 'user', content: apiContent }] }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Error en el servidor';
                throw new Error(errorMessage);
            }
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessage = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiMessage += chunk;

                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = aiMessage;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${msg}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50 to-transparent opacity-50" />
                <div className="px-6 py-6 flex items-center justify-between relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 mt-1">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="max-w-xl">
                            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Asistente Clínico IA</h1>
                            <p className="text-zinc-500 mt-1 text-sm leading-relaxed">
                                Herramienta de apoyo basada en la guía clínica <strong>"FPPocket: Preguntas y respuestas clave en fibrosis pulmonar progresiva"</strong> (Fundación Aire).
                                <span className="block mt-1 text-xs text-indigo-600 font-medium bg-indigo-50 w-fit px-2 py-0.5 rounded-full border border-indigo-100">
                                    v2.4 • Base de Conocimiento Actualizada
                                </span>
                            </p>
                        </div>
                    </div>
                    {/* Book Cover Image */}
                    <div className="hidden md:block flex-shrink-0 ml-6">
                        <div className="relative h-24 w-16 shadow-md rounded-sm overflow-hidden border border-zinc-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/fppocket-cover.jpg"
                                alt="FPPocket Cover"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none prose prose-sm prose-indigo'
                                }`}
                        >
                            {msg.role === 'user' ? (
                                <p>{msg.content}</p>
                            ) : (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-5 h-5 text-zinc-500" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && messages[messages.length - 1].role === 'user' && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-sm text-zinc-500">Analizando conocimiento...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-200">
                {/* Suggested Prompts */}
                <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mb-3">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSubmit(undefined, prompt)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {prompt.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={(e) => handleSubmit(e)} className="max-w-4xl mx-auto relative flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta sobre tratamientos, diagnósticos, guías..."
                        className="flex-1 p-4 pr-12 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center aspect-square"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
                <p className="text-center text-xs text-zinc-400 mt-2">
                    Las respuestas son generadas por IA y deben ser verificadas por un profesional.
                </p>
            </div>
        </div>
    );
}
