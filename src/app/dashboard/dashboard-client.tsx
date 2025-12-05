'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { signOutAction, updatePasswordAction } from '@/lib/actions/auth';
import { getUserSubscriptionAction } from '@/lib/actions/billing';
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/schemas/auth';
import type { User, SubscriptionWithPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SubscriptionCard } from '@/components/billing';

interface DashboardClientProps {
  user: User;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);

  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const { execute: executeSignOut, isExecuting: isSigningOut } = useAction(signOutAction);

  const {
    execute: executeUpdatePassword,
    isExecuting: isUpdatingPassword,
    result: passwordResult,
  } = useAction(updatePasswordAction, {
    onSuccess: () => {
      passwordForm.reset();
      setShowPasswordForm(false);
    },
  });

  const {
    execute: executeGetSubscription,
    isExecuting: isLoadingSubscription,
    result: subscriptionResult,
  } = useAction(getUserSubscriptionAction);

  useEffect(() => {
    executeGetSubscription();
  }, []);

  useEffect(() => {
    if (subscriptionResult?.data?.subscription) {
      setSubscription(subscriptionResult.data.subscription);
    }
  }, [subscriptionResult]);

  const handleSignOut = () => {
    executeSignOut();
  };

  const handleUpdatePassword = (data: UpdatePasswordInput) => {
    executeUpdatePassword(data);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="text-base">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
          </CardContent>
        </Card>

        {isLoadingSubscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Loading your subscription...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            </CardContent>
          </Card>
        ) : subscription ? (
          <SubscriptionCard subscription={subscription} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>You don't have an active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Subscribe to a plan to unlock all features
              </p>
              <Button onClick={() => (window.location.href = '/pricing')}>View Plans</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPasswordForm ? (
              <Button onClick={() => setShowPasswordForm(true)} variant="outline">
                Change Password
              </Button>
            ) : (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {passwordResult?.serverError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {passwordResult.serverError}
                    </div>
                  )}

                  {passwordResult?.data?.success && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                      {passwordResult.data.message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        passwordForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="destructive" disabled={isSigningOut}>
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
