'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-xl font-bold text-red-600">Algo salió mal cargando el portal</h2>
            <div className="text-sm text-zinc-500 bg-zinc-100 p-4 rounded-md max-w-lg overflow-auto">
                {error.message}
            </div>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
                Intentar de nuevo
            </button>
        </div>
    )
}
