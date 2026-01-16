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
                className={`relative flex items-center w-full px-4 py-2.5 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50 rounded-lg transition-colors group text-sm font-medium`}
                aria-label="Notificaciones"
            >
                <Bell className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-indigo-600" />
                <span>Exámenes cargados</span>

                {unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-zinc-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                            <h3 className="text-sm font-semibold text-zinc-900">
                                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={loading}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                                    >
                                        {loading ? 'Marcando...' : 'Marcar todas como leídas'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <Bell className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500">No hay notificaciones nuevas</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 mb-1">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-zinc-600 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                    <span>Paciente: {notification.patient.name}</span>
                                                    {notification.patient.rut && (
                                                        <span>RUT: {notification.patient.rut}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-400 mt-1">
                                                    {new Date(notification.createdAt).toLocaleString('es-CL', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <Link
                                                        href={`/patients/${notification.patient.id}/history`}
                                                        onClick={() => {
                                                            markAsRead(notification.id)
                                                            setIsOpen(false)
                                                        }}
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                    >
                                                        Ver historial →
                                                    </Link>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="flex-shrink-0 text-zinc-400 hover:text-zinc-600"
                                                title="Marcar como leída"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
