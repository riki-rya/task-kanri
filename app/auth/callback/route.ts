// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // 成功した場合、ホームページにリダイレクト
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Auth exchange error:', error)
        // エラーがある場合、エラーページにリダイレクト
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
  }

  // コードがない場合、ホームページにリダイレクト
  return NextResponse.redirect(`${origin}/`)
}