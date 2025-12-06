'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { updatePasswordAction } from '@/lib/actions/auth';
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

/**
 * PasswordSection component
 *
 * Handles password change functionality with validation.
 */
export function PasswordSection() {
	const [showPasswordForm, setShowPasswordForm] = useState(false);

	const passwordForm = useForm<UpdatePasswordInput>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	});

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

	const handleUpdatePassword = (data: UpdatePasswordInput) => {
		executeUpdatePassword(data);
	};

	return (
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
	);
}
