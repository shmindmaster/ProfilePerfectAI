import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TODO: Implement proper authentication middleware with NextAuth.js
  // For now, just pass through all requests
  const res = NextResponse.next()
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}