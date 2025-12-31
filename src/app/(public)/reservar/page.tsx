import { auth } from '@/auth';
import BookingClient from '@/components/BookingClient';
import { redirect } from 'next/navigation';

export default async function BookingPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login?callbackUrl=/reservar');
    }

    return <BookingClient
        userEmail={session.user.email}
        userName={session.user.name}
        isAdmin={session.user.role === 'ADMIN'}
    />;
}
