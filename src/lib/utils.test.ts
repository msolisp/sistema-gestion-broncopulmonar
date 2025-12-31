
import { cn } from './utils'

describe('cn utility', () => {
    it('merges class names correctly', () => {
        expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
    })

    it('handles conditional classes', () => {
        expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
    })

    it('merges tailwind classes using tailwind-merge', () => {
        expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
    })
})
