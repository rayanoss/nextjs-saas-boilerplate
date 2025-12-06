'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * QueryProvider component
 *
 * Provides TanStack Query client to the app (client-side only).
 * No SSR prefetching - all data fetched via Route Handlers on client.
 *
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * import { QueryProvider } from '@/lib/providers/query-provider'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <QueryProvider>{children}</QueryProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						gcTime: 5 * 60 * 1000,
						retry: 1,
						refetchOnWindowFocus: true,
					},
					mutations: {
						retry: 1,
					},
				},
			})
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
