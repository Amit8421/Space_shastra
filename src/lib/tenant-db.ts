import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Prisma, PrismaClient as TenantPrismaClient } from '@/generated/tenant-client'
import { AUTH_COOKIE_NAME } from './auth-config'
import { verifySessionToken } from './auth-token'
import { prisma as platformPrisma } from './db'
import { TENANT_SCHEMA_SQL } from './tenant-schema'

const globalForTenantPrisma = global as unknown as {
  tenantPrismaClients?: Map<string, TenantPrismaClient>
}

(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function toJSON(this: Prisma.Decimal) {
  return this.toNumber()
}

export function slugifyFirm(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function schemaNameForFirmSlug(slug: string) {
  const normalized = slugifyFirm(slug).replace(/-/g, '_')
  return `firm_${normalized}`.slice(0, 63)
}

export function assertSafeSchemaName(schemaName: string) {
  if (!/^firm_[a-z0-9_]{1,58}$/.test(schemaName)) {
    throw new Error('Invalid firm schema name.')
  }
}

function getTenantDatabaseUrl(schemaName: string) {
  assertSafeSchemaName(schemaName)
  const databaseUrl = process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured.')

  const url = new URL(databaseUrl)
  url.searchParams.set('schema', schemaName)
  return url.toString()
}

export function getTenantPrisma(schemaName: string) {
  assertSafeSchemaName(schemaName)
  if (!globalForTenantPrisma.tenantPrismaClients) {
    globalForTenantPrisma.tenantPrismaClients = new Map()
  }

  const cached = globalForTenantPrisma.tenantPrismaClients.get(schemaName)
  if (cached) return cached

  const client = new TenantPrismaClient({
    datasources: {
      db: {
        url: getTenantDatabaseUrl(schemaName),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  globalForTenantPrisma.tenantPrismaClients.set(schemaName, client)
  return client
}

export function getSessionPayloadFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  return token ? verifySessionToken(token) : null
}

export function getSessionPayloadFromCookies() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  return token ? verifySessionToken(token) : null
}

export function getTenantPrismaForRequest(request: NextRequest) {
  const payload = getSessionPayloadFromRequest(request)
  if (!payload?.firmSchema) {
    throw new Error('Firm session is required.')
  }
  return getTenantPrisma(payload.firmSchema)
}

export function getTenantPrismaForServerComponent() {
  const payload = getSessionPayloadFromCookies()
  if (!payload?.firmSchema) return null
  return getTenantPrisma(payload.firmSchema)
}

function splitSqlStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

export async function provisionFirmSchema(schemaName: string) {
  assertSafeSchemaName(schemaName)
  const quotedSchema = `"${schemaName}"`
  const statements = splitSqlStatements(TENANT_SCHEMA_SQL)

  await platformPrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`)
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${quotedSchema}`)

    for (const statement of statements) {
      await tx.$executeRawUnsafe(statement)
    }
  })
}
