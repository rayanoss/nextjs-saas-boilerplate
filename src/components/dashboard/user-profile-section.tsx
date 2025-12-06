'use client';

import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfileSectionProps {
	user: User;
}

/**
 * UserProfileSection component
 *
 * Displays user account information (email, username, user ID).
 */
export function UserProfileSection({ user }: UserProfileSectionProps) {
	return (
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
	);
}
