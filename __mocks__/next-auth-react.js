
const useSession = jest.fn(() => ({ data: null, status: 'unauthenticated' }));
const signOut = jest.fn();
const SessionProvider = ({ children }) => children;

module.exports = {
    useSession,
    signOut,
    SessionProvider,
};
