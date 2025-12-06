# Next.js Production Boilerplate

A production-ready Next.js boilerplate with authentication, database, and type-safe server actions.

## Tech Stack

### Core
- **Next.js 16** - React framework with App Router
- **TypeScript** - Strict mode enabled
- **TailwindCSS 4** - Utility-first CSS framework

### Backend
- **Supabase Auth** - Authentication with SSR support
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Database via Supabase (Transaction Pooler)
- **next-safe-action** - Type-safe server actions with validation
- **TanStack Query** - Client-side data fetching and caching
- **LemonSqueezy** - Subscription billing and payments

### Validation & Types
- **Zod** - Runtime validation and type inference
- **TypeScript strict mode** - Maximum type safety

## Project Structure

```
src/
├── lib/
│   ├── actions/           # Server actions with next-safe-action (mutations only)
│   ├── hooks/             # Client-side hooks (TanStack Query for user data)
│   ├── providers/         # React context providers (QueryProvider)
│   ├── services/          # Business logic layer (pure functions)
│   ├── db/                # Database layer (Drizzle schema, queries, migrations)
│   ├── supabase/          # Supabase clients (server, browser, middleware)
│   ├── config/            # Configuration files (LemonSqueezy SDK)
│   ├── schemas/           # Zod validation schemas
│   ├── types/             # Centralized TypeScript type definitions
│   └── errors.ts          # Custom error classes
│
├── components/
│   ├── ui/                # ShadCN UI components
│   ├── billing/           # Billing-related components
│   └── dashboard/         # Dashboard section components
│
├── app/                   # Next.js App Router
│   ├── (pages)/           # Public and authenticated pages
│   └── api/               # Route Handlers and webhooks
│
├── scripts/               # Utility scripts (sync plans, retry webhooks)
└── middleware.ts          # Route protection & session refresh
```

## Architecture Principles

### Three-Layer Architecture

**1. Actions Layer** (`lib/actions/`)
- Input validation with Zod schemas
- Error handling and formatting
- Cache invalidation (revalidatePath)
- Redirects
- Calls services for business logic

**2. Services Layer** (`lib/services/`)
- Pure business logic
- No validation or error formatting
- Testable (no framework dependencies)
- Reusable across actions, cron jobs, webhooks

**3. Data Layer** (`lib/db/queries/`)
- Database operations
- Type-safe queries with Drizzle ORM
- Single responsibility (data access only)

### Benefits

- **Separation of concerns** - Each layer has a clear responsibility
- **Testability** - Services are pure functions, easy to test
- **Reusability** - Services can be called from anywhere
- **Type safety** - End-to-end type inference
- **Maintainability** - Changes are isolated to specific layers

## Database Configuration

### Connection Strategy

Uses Supabase Transaction Pooler (port 6543) optimized for serverless environments.

**Configuration** (`lib/db/connection.ts`):
```typescript
const client = postgres(process.env['DATABASE_URL'], {
  max: 10,           // Max connections for serverless
  prepare: false,    // Required for Transaction Pooler
});
```

**Why Transaction Pooler?**
- Each Next.js API route is a separate serverless function
- Direct connections (port 5432) would create too many connections
- Transaction Pooler reuses connections across functions
- Prevents "too many connections" errors

### Schema Management

**Drizzle Kit** manages database schema and migrations.

Commands:
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Authentication

### Supabase Auth with SSR

**Client Types:**

1. **Server Client** (`lib/supabase/server.ts`)
   - Used in Server Components, Server Actions, Route Handlers
   - Reads cookies for session management
   - Cannot mutate cookies in Server Components

2. **Browser Client** (`lib/supabase/client.ts`)
   - Used in Client Components
   - Singleton pattern (one instance per app)
   - Automatic cookie handling via document.cookie

3. **Middleware Helper** (`lib/supabase/middleware.ts`)
   - Refreshes expired sessions automatically
   - Sets cookies on both request and response
   - Critical: Only place where session refresh happens

### Auth Flow

**Middleware** (`middleware.ts`):
- Runs on every request
- Refreshes expired sessions
- Protects authenticated routes
- Redirects based on auth state

**Protected Routes:**
- `/dashboard` - Requires authentication
- `/profile` - Requires authentication
- `/settings` - Requires authentication

**Auth Routes** (redirect if authenticated):
- `/login`
- `/signup`
- `/forgot-password`

## Error Handling Architecture

### Custom Error Classes (`lib/errors.ts`)

Following next-safe-action best practices, we use custom error classes for different error types:

**ValidationError** - Business logic validation failures
```typescript
throw new ValidationError('Username is already taken', 'username');
// Displays error under the 'username' field in the form
```

**AuthenticationError** - Authentication/authorization failures
```typescript
throw new AuthenticationError('Invalid email or password');
// Displayed as a general error to the user
```

**DatabaseError** - Database/infrastructure failures
```typescript
throw new DatabaseError('Connection timeout');
// Masked in production: "A database error occurred"
```

**ExternalAPIError** - Third-party service failures
```typescript
throw new ExternalAPIError('Failed to send email');
// Masked in production: "An external service error occurred"
```

### Error Flow

```
Service → Throw Custom Error
    ↓
Action → Catch ValidationError → returnValidationErrors (field-specific)
    ↓
Action → Re-throw Other Errors
    ↓
handleServerError → Pattern match error type → Return appropriate message
    ↓
Client → Display error (result.validationErrors or result.serverError)
```

**Example:**

1. User submits signup with taken username
2. Service throws `ValidationError('Username is already taken', 'username')`
3. Action catches it and calls `returnValidationErrors(schema, { username: { _errors: [...] } })`
4. Client receives `result.validationErrors.username` and displays error under username field

### Benefits

- **Field-specific errors**: Validation errors appear under the relevant field
- **Security**: Technical errors are masked in production
- **Type safety**: Custom error classes are typed and can be pattern matched
- **Centralized**: All error handling logic in one place (`handleServerError`)
- **Reusable**: Services can be used anywhere (actions, cron jobs, webhooks)

## Server Actions with next-safe-action

### Why next-safe-action?

**Without next-safe-action:**
- Manual validation of FormData
- Manual error handling
- No type safety from server to client
- Manual loading/error states on client

**With next-safe-action:**
- Automatic validation with Zod
- Centralized error handling
- End-to-end type safety
- Automatic loading/error states via hooks

### Action Client Configuration

**Base Client** (`lib/actions/safe-action.ts`):
```typescript
export const actionClient = createSafeActionClient({
  handleServerError(e, utils) {
    // Centralized error logging
    // Custom error formatting
    // Environment-specific error messages
  },
});
```

**Auth Client** (requires authentication):
```typescript
export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  return next({ ctx: { user, userId: user.id } });
});
```

### Available Actions

**Public Actions:**
- `signUpAction` - Create new account
- `signInAction` - Authenticate user
- `requestPasswordResetAction` - Request password reset email
- `resetPasswordAction` - Reset password with token

**Authenticated Actions:**
- `signOutAction` - Sign out current user
- `updatePasswordAction` - Update password

### Client Usage

```typescript
'use client';

import { useAction } from 'next-safe-action/hooks';
import { signUpAction } from '@/lib/actions/auth';

export function SignUpForm() {
  const { execute, isExecuting, result } = useAction(signUpAction);

  const handleSubmit = (data) => {
    execute(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {isExecuting && <p>Loading...</p>}
      {result.serverError && <p>Error: {result.serverError}</p>}
      {result.data?.success && <p>Success!</p>}
    </form>
  );
}
```

## Caching Strategy

### Overview

The boilerplate implements a **hybrid caching strategy** that combines server-side and client-side caching for optimal performance and scalability.

### Architecture Principles

**Server-side Cache (`unstable_cache`)** - For global data shared across all users
- ✅ Use for: Plans, pricing, public content
- ✅ Benefits: Reduces database queries, shared across all users
- ❌ Avoid for: User-specific data (scalability issue - one cache entry per user)

**Client-side Cache (TanStack Query)** - For user-specific data
- ✅ Use for: User subscriptions, preferences, personalized data
- ✅ Benefits: Scalable (cache stored in user's browser), instant navigation
- ❌ Avoid for: Global data that changes frequently

### Data Fetching Patterns

**Pattern 1: Global Data (Plans)**
```typescript
// Service with server-side cache
export const getAvailablePlans = unstable_cache(
  async (): Promise<Plan[]> => {
    return await getActivePlans();
  },
  ['available-plans'],
  { revalidate: 3600, tags: ['plans'] }
);

// Server Component directly calls service
export default async function PricingPage() {
  const plans = await getAvailablePlans(); // Cached for 1 hour
  return <PricingCards plans={plans} />;
}
```

**Pattern 2: User-Specific Data (Subscription)**
```typescript
// Route Handler (no server cache)
export async function GET() {
  const user = await getCurrentUser();
  const subscription = await getUserSubscription(user.id); // Not cached server-side
  return Response.json(subscription);
}

// TanStack Query hook (client cache)
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes client cache
  });
}

// Client Component uses hook
export function SubscriptionSection() {
  const { data, isLoading } = useSubscription();
  // Cache stored in user's browser
}
```

**Pattern 3: Mutations with Cache Invalidation**
```typescript
// Mutation hook wraps Server Action
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useAction(createCheckoutAction, {
    onSuccess: () => {
      // Invalidate client cache after mutation
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
```

### Cache Invalidation

**Server-side Cache:**
- Time-based: `revalidate: 3600` (1 hour)
- Tag-based: `revalidateTag('plans')` in Server Actions
- Use for: Global data that changes infrequently

**Client-side Cache:**
- Automatic: After mutations via `queryClient.invalidateQueries()`
- Manual: `queryClient.refetchQueries()` or `router.refresh()`
- Use for: User-specific data that changes after user actions

### Why This Architecture?

**Scalability:**
- Server cache for global data: 1 cache entry shared across all users
- Client cache for user data: 1M users = 1M browser caches, 0 server memory

**Performance:**
- Server cache: Reduces database queries
- Client cache: Reduces HTTP requests, instant navigation

**Best Practices:**
- GET operations for user data: Route Handlers + TanStack Query
- GET operations for global data: Server Components + `unstable_cache`
- Mutations: Server Actions with `next-safe-action`

### Available Hooks

**Query Hooks:**
- `useSubscription()` - Fetch user's subscription with client-side caching

**Mutation Hooks:**
- `useCreateCheckout()` - Create checkout with automatic cache invalidation

## Validation Schemas

### Zod Schemas (`lib/schemas/auth.ts`)

**Email Validation:**
- Valid email format
- Normalized to lowercase
- Trimmed whitespace

**Password Validation:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Username Validation:**
- 3-20 characters
- Alphanumeric and underscores only
- Cannot start/end with underscore
- Lowercase only

### Available Schemas

- `signUpSchema` - Email, password, username
- `signInSchema` - Email, password
- `resetPasswordRequestSchema` - Email
- `resetPasswordConfirmSchema` - Password, confirm password
- `updatePasswordSchema` - Current password, new password, confirm

## Subscription Billing with LemonSqueezy

### Overview

The boilerplate includes a complete subscription billing system using LemonSqueezy:

- **Plan Management** - Sync plans from LemonSqueezy API
- **Checkout Flow** - Redirect users to LemonSqueezy payment page
- **Webhook Processing** - Automatic subscription sync via webhooks
- **Customer Portal** - Manage subscriptions via LemonSqueezy portal
- **Type-safe** - Full TypeScript support across the billing stack

### Database Schema

**Plans Table** (`plans`):
- Stores subscription plans synced from LemonSqueezy
- Fields: name, price, interval (month/year), variant_id, is_active

**Subscriptions Table** (`subscriptions`):
- User subscriptions with status and renewal dates
- Foreign keys: user_id, plan_id
- LemonSqueezy data: customer_id, order_id, portal URLs

**Webhook Events Table** (`webhook_events`):
- Logs all webhook events for idempotency and debugging
- Store-then-process pattern for reliability

### Setup Instructions

**1. Create LemonSqueezy Account**
- Sign up at https://lemonsqueezy.com
- Create your store

**2. Create Products**
- Go to Products → Create Product
- Add variants (pricing) for each product
- Publish products

**3. Get API Credentials**

```bash
# API Key (https://app.lemonsqueezy.com/settings/api)
LEMONSQUEEZY_API_KEY=lmsk_your_api_key_here

# Store ID (https://app.lemonsqueezy.com/settings/stores)
LEMONSQUEEZY_STORE_ID=12345

# Webhook Secret (generate a random string)
# Command: node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
LEMONSQUEEZY_WEBHOOK_SECRET=your_random_secret_here
```

**4. Sync Plans to Database**

```bash
npm run sync:plans
```

This fetches all products from LemonSqueezy and stores them in your database.

**5. Configure Webhook (Production Only)**

- Go to https://app.lemonsqueezy.com/settings/webhooks
- Create webhook with URL: `https://yourdomain.com/api/webhooks/lemonsqueezy`
- Select all `subscription_*` events
- Use the same `LEMONSQUEEZY_WEBHOOK_SECRET` from step 3

**Note:** Webhooks require HTTPS. For local testing, use ngrok or skip webhooks in development.

### Billing Flow

**1. User Views Plans** (`/pricing`)
- Displays all active plans from database
- User clicks "Subscribe" button

**2. Checkout Creation**
- Action calls `createCheckoutUrl()` service
- Service creates LemonSqueezy checkout with user_id in custom_data
- User redirected to LemonSqueezy payment page

**3. User Completes Payment**
- LemonSqueezy processes payment
- User redirected back to your app

**4. Webhook Processing**
- LemonSqueezy sends `subscription_created` webhook
- Webhook stored in database (idempotency)
- Subscription synced to database asynchronously
- User can now access subscription features

**5. Subscription Management**
- User views subscription in dashboard
- "Manage Subscription" redirects to LemonSqueezy Customer Portal
- User can update payment method, cancel, etc.

### Available Actions

**Public Actions:**
- `getPlansAction` - Fetch all active plans
- `createCheckoutAction` - Create checkout and redirect to payment

**Authenticated Actions:**
- `getUserSubscriptionAction` - Get user's current subscription

### Components

**PricingCard** (`components/billing/pricing-card.tsx`):
- Displays plan details (name, price, interval)
- Subscribe button triggers checkout

**SubscriptionCard** (`components/billing/subscription-card.tsx`):
- Shows current subscription status
- Renewal/expiration dates
- Link to Customer Portal

### Security Features

- **Webhook Signature Verification** - Validates webhooks are from LemonSqueezy
- **Store-then-Process Pattern** - Ensures idempotency
- **Custom Error Handling** - Uses ValidationError and ExternalAPIError
- **Type-safe** - Full TypeScript coverage

### Troubleshooting

**"No plans available"**
- Run `npm run sync:plans` to sync from LemonSqueezy
- Ensure products are published in LemonSqueezy dashboard

**"Failed to create checkout"**
- Verify LEMONSQUEEZY_API_KEY is correct
- Check plan exists and is active
- Ensure user doesn't already have a subscription

**"Webhook not working"**
- Verify LEMONSQUEEZY_WEBHOOK_SECRET matches in both places
- Check webhook URL is accessible (HTTPS required)
- Review webhook_events table for error messages

## Environment Variables

Create `.env.local` file:

```bash
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Future-proof API keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase Transaction Pooler)
DATABASE_PASSWORD=your-db-password
DATABASE_URL=postgresql://postgres.tenant_id:password@aws-region.pooler.supabase.com:6543/postgres

# LemonSqueezy (Billing)
LEMONSQUEEZY_API_KEY=lmsk_your_api_key_here
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note:** Use the new Supabase API key format (`sb_publishable_*` and `sb_secret_*`) for future compatibility. Legacy `anon` keys will be deprecated in 2026.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate database migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Start development server
npm run dev
```

### Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate   # Generate migration
npm run db:migrate    # Apply migrations
npm run db:studio     # Open database GUI

# Billing commands
npm run sync:plans       # Sync plans from LemonSqueezy
npm run retry:webhooks   # Retry failed webhook processing
```

## Type Safety

### Type Inference Flow

```
Zod Schema → Drizzle Schema → Services → Actions → Client
    ↓            ↓              ↓          ↓         ↓
  Input       Database      Business   Validation  UI
  Types        Types         Logic      + Errors   Types
```

**Example:**

1. Zod schema defines validation: `signUpSchema`
2. Drizzle schema defines database: `users` table
3. Service uses types: `SignUpInput → User`
4. Action validates and calls service
5. Client hook gets typed result: `result.data`

### Exported Types (`lib/types.ts`)

**Database Types:**
- `User` - User profile from database
- `NewUser` - Insert data for new user

**Auth Types:**
- `SignUpInput`, `SignInInput`
- `ResetPasswordRequestInput`, `ResetPasswordConfirmInput`
- `UpdatePasswordInput`

**Client Types:**
- `ServerClient` - Supabase server client type
- `BrowserClient` - Supabase browser client type

## Security Features

### Input Validation
- All user input validated with Zod schemas
- Validation happens before database access
- Type-safe from client to database

### Authentication
- Supabase Auth with Row Level Security (RLS)
- Session-based authentication via cookies
- Automatic session refresh in middleware
- Protected routes with automatic redirects

### Error Handling
- **Custom error classes** for different error types
- **Validation errors** displayed under relevant form fields
- **Authentication errors** shown to users
- **Technical errors** (database, external APIs) masked in production
- **Centralized error handling** in `handleServerError`
- Email enumeration prevention (password reset)
- Detailed error logging in development

### Database Security
- Prepared statements disabled (required for Transaction Pooler)
- Connection pooling to prevent resource exhaustion
- Environment variables for credentials
- No sensitive data in error messages

## Best Practices

### When to Use Each Layer

**Use Actions when:**
- You need to validate user input
- You need to handle errors for the client
- You need to revalidate cache
- You need to redirect after operation

**Use Services when:**
- You have reusable business logic
- You need to compose multiple operations
- You want testable functions
- You need to call from multiple places

**Use Queries when:**
- You need to access the database
- You want type-safe database operations
- You need reusable data access functions

### Code Organization

**Do:**
- Keep actions thin (validation + service call)
- Put business logic in services
- Make services pure functions
- Use descriptive function names
- Export types from centralized file

**Don't:**
- Put business logic in actions
- Mix validation with business logic
- Create circular dependencies
- Use `any` type
- Skip error handling

## Production Checklist

### Before Deploying

- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Supabase project configured
- [ ] NEXT_PUBLIC_APP_URL updated
- [ ] Error logging configured (Sentry, etc.)
- [ ] TypeScript strict mode enabled
- [ ] Build passes without errors

### Monitoring

- [ ] Error logging (server errors)
- [ ] Performance monitoring
- [ ] Database connection pooling metrics
- [ ] Authentication success/failure rates

## Contributing

### Adding New Features

1. Create Zod schema (`lib/schemas/`)
2. Create service function (`lib/services/`)
3. Create action (`lib/actions/`)
4. Add types to `lib/types.ts`
5. Update this README

### Testing

Services are designed to be testable:

```typescript
// Example: Testing auth service
import { signUpUser } from '@/lib/services/auth';

test('signUpUser creates user', async () => {
  const user = await signUpUser({
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test1234',
  });

  expect(user.email).toBe('test@example.com');
});
```

## Action Helpers

### What was done
Created a reusable helper function to eliminate repetitive ValidationError handling code in actions.

### Details
- **New file**: `src/lib/actions/helpers.ts` containing `handleValidationError` function
- **Purpose**: Converts service-layer `ValidationError` instances to next-safe-action field-specific validation errors
- **Benefits**:
  - Eliminates 7-line repetitive pattern across actions
  - Single line usage: `handleValidationError(error, schema)`
  - Maintains separation of concerns (services remain framework-agnostic)
  - Scalable for future actions requiring ValidationError handling
- **Updated files**: `src/lib/actions/auth.ts` now uses the helper in `signUpAction` and `updatePasswordAction`
- **Type safety**: Accepts `unknown` error parameter with internal type checking
- **Configuration**: Added `typecheck` script to `package.json` for TypeScript validation
- **Hook configuration**: Updated `.claude/settings.json` to move typecheck from pre-edit to post-edit hooks

## License

MIT
