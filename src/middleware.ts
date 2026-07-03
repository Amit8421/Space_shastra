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

type EdgeSessionPayload = {
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  firmId: string
  firmSchema: string
  exp: number
}

const verifySessionToken = async (token?: string): Promise<EdgeSessionPayload | null> => {
  const secret = process.env.AUTH_SECRET
  if (!token || !secret) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expectedSignature = bytesToBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
  if (signature !== expectedSignature) return null

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as EdgeSessionPayload
    return typeof parsed.exp === 'number' && parsed.exp > Date.now() &&
      typeof parsed.firmId === 'string' && typeof parsed.firmSchema === 'string' &&
      ['ADMIN', 'MANAGER', 'VIEWER'].includes(parsed.role)
      ? parsed
      : null
  } catch {
    return null
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

  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (session) {
    if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      return NextResponse.redirect(homeUrl)
    }
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/admin/') && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })
      }
      const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
      if (isWrite && session.role === 'VIEWER') {
        return NextResponse.json({ error: 'Viewer accounts are read-only.' }, { status: 403 })
      }
      if (request.method === 'DELETE' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only administrators can delete records.' }, { status: 403 })
      }
    }
    return NextResponse.next()
  }

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
