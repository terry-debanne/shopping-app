import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Laisser passer les fichiers publics PWA
  if (pathname.startsWith('/manifest') || pathname.startsWith('/icon-') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const auth = req.cookies.get('app-auth')?.value
  if (auth === 'ok') return NextResponse.next()

  if (pathname === '/login') return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next).*)'],
}
