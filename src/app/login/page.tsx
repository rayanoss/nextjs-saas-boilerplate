'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

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
          {mode === 'login' && <SignInForm />}
          {mode === 'signup' && <SignUpForm />}
          {mode === 'forgot' && <ForgotPasswordForm />}
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
