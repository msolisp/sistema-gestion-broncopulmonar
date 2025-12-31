
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { Request, Response, Headers } from 'cross-fetch'

Object.assign(global, { TextEncoder, TextDecoder, Request, Response, Headers })
