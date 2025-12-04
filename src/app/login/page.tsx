'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { signInAction, signUpAction, requestPasswordResetAction } from '@/lib/actions/auth';
import {
  signInSchema,
  signUpSchema,
  resetPasswordRequestSchema,
  type SignInInput,
  type SignUpInput,
  type ResetPasswordRequestInput,
} from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const loginForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  });

  const forgotForm = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const { execute: executeLogin, isExecuting: isLoggingIn, result: loginResult } = useAction(signInAction);

  const { execute: executeSignup, isExecuting: isSigningUp, result: signupResult } = useAction(signUpAction);

  const {
    execute: executeForgot,
    isExecuting: isSendingReset,
    result: forgotResult,
  } = useAction(requestPasswordResetAction, {
    onSuccess: () => {
      forgotForm.reset();
    },
  });

  const handleLogin = (data: SignInInput) => {
    executeLogin(data);
  };

  const handleSignup = (data: SignUpInput) => {
    executeSignup(data);
  };

  const handleForgot = (data: ResetPasswordRequestInput) => {
    executeForgot(data);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Enter your credentials to access your account';
      case 'signup':
        return 'Fill in your details to create a new account';
      case 'forgot':
        return 'Enter your email to receive a password reset link';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'login' && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
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

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginResult?.serverError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {loginResult.serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'signup' && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
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

                <FormField
                  control={signupForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {signupResult?.serverError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {signupResult.serverError}
                  </div>
                )}

                {signupResult?.data?.success && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {signupResult.data.message}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'forgot' && (
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
                <FormField
                  control={forgotForm.control}
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

                {forgotResult?.data?.success && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {forgotResult.data.message}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSendingReset}>
                  {isSendingReset ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          {mode === 'login' && (
            <>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-medium text-primary hover:underline"
                >
                  Create one
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Forgot your password?
              </button>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Back to login
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
