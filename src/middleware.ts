import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from './lib/auth-config'

const PUBLIC_FILE = /\.(.*)$/
const AUTH_ROUTES = new Set(['/login', '/api/auth/login', '/api/auth/logout'])

const base64UrlToBytes = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const bytesToBase64Url = (bytes: ArrayBuffer) => {
  let binary = ''
  new Uint8Array(bytes).forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const verifySessionToken = async (token?: string) => {
  const secret = process.env.AUTH_SECRET
  if (!token || !secret) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expectedSignature = bytesToBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
  if (signature !== expectedSignature) return false

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)))
    return typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/payment-qr.png') ||
    pathname.startsWith('/dashboard-logo.png') ||
    pathname.startsWith('/logo') ||
    PUBLIC_FILE.test(pathname) ||
    AUTH_ROUTES.has(pathname)
  ) {
    return NextResponse.next()
  }

  const isAuthenticated = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (isAuthenticated) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
