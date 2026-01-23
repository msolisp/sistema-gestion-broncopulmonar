import { protectRoute } from "@/lib/route-protection";
import AssistantContent from "@/components/AssistantContent";

export default async function AssistantPage() {
    await protectRoute({
        requiredPermission: 'Ver Asistente',
        redirectTo: '/dashboard'
    });

    return <AssistantContent />;
}
