import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('app-auth')?.value
  if (auth === 'ok') return NextResponse.next()

  const url = req.nextUrl.clone()
  if (url.pathname === '/login') return NextResponse.next()

  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
