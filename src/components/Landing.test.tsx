
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../app/(public)/page'

describe('Landing Page', () => {
    it('renders the main heading', () => {
        render(<Home />)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toHaveTextContent(/Gestión Integral de Fibrosis Pulmonar/i)
    })

    it('renders call to action buttons', () => {
        render(<Home />)
        expect(screen.getByRole('link', { name: /Ver Demo Clínica/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Contacto Profesional/i })).toBeInTheDocument()
    })
})
