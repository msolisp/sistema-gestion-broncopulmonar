'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    createdAt: string
    read: boolean
    patient: {
        id: string
        name: string
        email: string
        rut: string | null
    }
    examId: string | null
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            if (res.ok) {
                // Remove notification from list
                setNotifications(prev => prev.filter(n => n.id !== id))
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true }),
            })

            if (res.ok) {
                setNotifications([])
                setIsOpen(false)
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch on mount and every 30 seconds
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    // Fetch when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const unreadCount = notifications.length

    return (
        <div className="relative w-full">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex items-center w-full px-4 py-2.5 rounded-lg transition-colors group text-sm font-medium ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50'}`}
                aria-label="Notificaciones"
            >
                <Bell className={`w-5 h-5 mr-3 ${isOpen ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-indigo-600'}`} />
                <span>Exámenes cargados</span>

                {unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Inline Accordion */}
            {isOpen && (
                <div className="mt-1 ml-4 w-[calc(100%-1rem)] bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
                        <h3 className="text-xs font-semibold text-zinc-700">
                            Recientes
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                            >
                                {loading ? '...' : 'Marcar leídas'}
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-3 py-6 text-center">
                                <p className="text-xs text-zinc-400">Sin novedades</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="px-3 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors last:border-0"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-xs font-medium text-zinc-900 leading-tight">
                                                {notification.patient.name}
                                            </p>
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-zinc-300 hover:text-zinc-500 p-0.5"
                                                title="Marcar leída"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <p className="text-[10px] text-zinc-500">
                                            {new Date(notification.createdAt).toLocaleString('es-CL', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>

                                        <Link
                                            href={`/patients/${notification.patient.id}/history`}
                                            onClick={() => {
                                                markAsRead(notification.id)
                                                // Optional: keep open or close?
                                            }}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center mt-1"
                                        >
                                            Ver detalles →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
