'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard Overview Page
 *
 * Main dashboard page showing overview statistics and quick actions.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Toast Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications Test</CardTitle>
          <CardDescription>Test different types of toast notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success('Success!', { description: 'Operation completed successfully' })}>
            Success Toast
          </Button>
          <Button
            variant="destructive"
            onClick={() => toast.error('Error!', { description: 'Something went wrong' })}
          >
            Error Toast
          </Button>
          <Button variant="outline" onClick={() => toast.info('Info', { description: 'Here is some information' })}>
            Info Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning('Warning', { description: 'Please be careful' })}
          >
            Warning Toast
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const promise = new Promise((resolve) => setTimeout(resolve, 2000));
              toast.promise(promise, {
                loading: 'Loading...',
                success: 'Done!',
                error: 'Failed!',
              });
            }}
          >
            Promise Toast
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$12,345</p>
            <p className="text-sm text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Currently online</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2,350</p>
            <p className="text-sm text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Orders</CardTitle>
            <CardDescription>Today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">145</p>
            <p className="text-sm text-muted-foreground">+5% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                📊
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New report generated</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                👥
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">3 new customers joined</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                🛒
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">12 orders completed</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
