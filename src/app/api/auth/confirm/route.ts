import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/clients';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Succès - redirige vers dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Erreur - redirige vers login
  return NextResponse.redirect(
    new URL('/login?error=Email confirmation failed', request.url)
  );
}
