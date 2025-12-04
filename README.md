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

### Validation & Types
- **Zod** - Runtime validation and type inference
- **TypeScript strict mode** - Maximum type safety

## Project Structure

```
src/
├── lib/
│   ├── actions/           # Server actions with next-safe-action
│   │   ├── safe-action.ts # Action client configuration
│   │   └── auth.ts        # Auth actions (signup, login, etc.)
│   │
│   ├── services/          # Business logic layer
│   │   └── auth.ts        # Auth services (reusable functions)
│   │
│   ├── db/                # Database layer
│   │   ├── schema.ts      # Drizzle schema definitions
│   │   ├── connection.ts  # Database client configuration
│   │   ├── queries/       # Type-safe query functions
│   │   └── migrations/    # SQL migrations
│   │
│   ├── supabase/          # Supabase clients
│   │   ├── server.ts      # Server-side client
│   │   ├── client.ts      # Client-side client (browser)
│   │   └── middleware.ts  # Session refresh helper
│   │
│   ├── schemas/           # Zod validation schemas
│   │   └── auth.ts        # Auth input validation
│   │
│   └── types.ts           # Centralized type definitions
│
├── middleware.ts          # Route protection & session refresh
└── app/                   # Next.js App Router
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
- Sensitive errors masked in production
- Detailed errors in development
- Email enumeration prevention (password reset)
- Centralized error logging

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

## License

MIT
