'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { requestPasswordResetAction } from '@/lib/actions/auth';
import { resetPasswordRequestSchema, type ResetPasswordRequestInput } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export const ForgotPasswordForm = () => {
  const form = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const { execute, isExecuting, result } = useAction(requestPasswordResetAction, {
    onSuccess: () => {
      form.reset();
    },
  });

  const handleSubmit = (data: ResetPasswordRequestInput) => {
    execute(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {result?.data?.success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {result.data.message}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isExecuting}>
          {isExecuting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </Form>
  );
};
