export class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
        this.type = 'CredentialsSignin'; // Default for testing
    }
}

const NextAuth = () => ({
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: { GET: jest.fn(), POST: jest.fn() },
});

export default NextAuth;
