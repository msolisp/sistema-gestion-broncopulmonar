
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { Request, Response, Headers } from 'cross-fetch'

Object.assign(global, { TextEncoder, TextDecoder, Request, Response, Headers })

// Mock next-auth/providers/credentials to avoid ESM issues
jest.mock('next-auth/providers/credentials', () => ({
    __esModule: true,
    default: jest.fn(() => ({})),
}))

// Mock next-auth to avoid ESM issues
jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        auth: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        handlers: { GET: jest.fn(), POST: jest.fn() },
    })),
}))
