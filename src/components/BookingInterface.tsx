
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface BookingInterfaceProps {
    onConfirm: (date: Date) => void
    isPending: boolean
}

export default function BookingInterface({ onConfirm, isPending }: BookingInterfaceProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Calendar logic
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, 'd')
            const cloneDay = day
            const isDisabled = isPast(day) && !isToday(day)

            days.push(
                <button
                    type="button"
                    key={day.toString()}
                    disabled={isDisabled}
                    onClick={() => {
                        setSelectedDate(cloneDay)
                        setSelectedTime(null)
                    }}
                    className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all",
                        !isSameMonth(day, currentMonth) && "text-zinc-300",
                        isDisabled && "text-zinc-300 opacity-50 cursor-not-allowed",
                        isSameMonth(day, currentMonth) && !isDisabled && "text-zinc-700 hover:bg-indigo-50",
                        isSameDay(day, selectedDate) && "bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md",
                        isSameDay(day, new Date()) && !isSameDay(day, selectedDate) && "border border-indigo-600 text-indigo-600"
                    )}
                >
                    {formattedDate}
                </button>
            )
            day = addDays(day, 1)
        }
        rows.push(
            <div className="grid grid-cols-7 gap-1 mb-2" key={day.toString()}>
                {days}
            </div>
        )
        days = []
    }

    // Time Slots Mockup (1 Hour Intervals)
    const morningSlots = ['09:00', '10:00', '11:00', '12:00']
    const afternoonSlots = ['14:00', '15:00', '16:00', '17:00']

    // Mock occupied slots logic (e.g., random logic or specific hardcoded for demo)
    // For demo: 10:00 and 15:00 are always occupied
    const checkAvailability = (time: string) => {
        if (time === '10:00' || time === '15:00') return 'occupied';

        // If today, check if time is past
        if (isToday(selectedDate)) {
            const [hours, minutes] = time.split(':').map(Number);
            const now = new Date();
            const slotDate = new Date(selectedDate);
            slotDate.setHours(hours, minutes);
            if (isPast(slotDate)) return 'past';
        }

        return 'available';
    }

    const handleConfirm = () => {
        if (!selectedDate || !selectedTime) return

        const [hours, minutes] = selectedTime.split(':').map(Number)
        const finalDate = new Date(selectedDate)
        finalDate.setHours(hours)
        finalDate.setMinutes(minutes)

        onConfirm(finalDate)
    }

    const renderSlot = (time: string) => {
        const status = checkAvailability(time)
        const isSelected = selectedTime === time

        return (
            <button
                type="button"
                key={time}
                disabled={status !== 'available'}
                onClick={() => setSelectedTime(time)}
                className={cn(
                    "w-full py-2.5 px-4 rounded-lg text-sm border font-medium transition-all",
                    status === 'occupied' && "bg-zinc-100 text-zinc-400 border-zinc-100 cursor-not-allowed",
                    status === 'past' && "bg-zinc-100 text-zinc-400 border-zinc-100 cursor-not-allowed",
                    status === 'available' && !isSelected && "bg-white border-zinc-200 text-zinc-700 hover:border-indigo-500 hover:text-indigo-600",
                    isSelected && "bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-200 ring-offset-1"
                )}
            >
                <div className="flex justify-between items-center">
                    <span>{time}</span>
                    {status === 'occupied' && <span className="text-xs font-normal opacity-70">(Ocupado)</span>}
                    {status === 'past' && <span className="text-xs font-normal opacity-70">(Pasado)</span>}
                </div>
            </button>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Calendar Section */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-zinc-900 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <div>Do</div>
                    <div>Lu</div>
                    <div>Ma</div>
                    <div>Mi</div>
                    <div>Ju</div>
                    <div>Vi</div>
                    <div>Sa</div>
                </div>
                <div>{rows}</div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-zinc-200 self-stretch"></div>

            {/* Time Slots Section */}
            <div className="flex-1 lg:max-w-xs">
                <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center">
                    Horarios para el {format(selectedDate, 'd', { locale: es })}
                    {isToday(selectedDate) && <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Hoy</span>}
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        {morningSlots.map(renderSlot)}
                    </div>

                    <div className="space-y-2">
                        {afternoonSlots.map(renderSlot)}
                    </div>
                </div>

                {/* Confirmation Area */}
                <div className="mt-8 pt-6 border-t border-zinc-100 sticky bottom-0 bg-white/95 backdrop-blur-sm lg:relative">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={!selectedDate || !selectedTime || isPending}
                            onClick={handleConfirm}
                            className="flex-[2] px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            {isPending ? 'Confirmando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
