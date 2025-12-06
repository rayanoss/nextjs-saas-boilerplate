'use client';

import { useAction } from 'next-safe-action/hooks';
import { signOutAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * AccountActionsSection component
 *
 * Handles dangerous/irreversible account actions (sign out, delete account, etc.).
 */
export function AccountActionsSection() {
	const { execute: executeSignOut, isExecuting: isSigningOut } = useAction(signOutAction);

	const handleSignOut = () => {
		executeSignOut();
	};

	return (
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
	);
}
