import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import {
  UserProfileSection,
  SubscriptionSection,
  PasswordSection,
  AccountActionsSection,
} from '@/components/dashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <UserProfileSection user={user} />
        <SubscriptionSection />
        <PasswordSection />
        <AccountActionsSection />
      </div>
    </div>
  );
}
