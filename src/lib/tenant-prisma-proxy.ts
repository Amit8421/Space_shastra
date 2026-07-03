import type { PrismaClient as TenantPrismaClient } from '@/generated/tenant-client'
import { getSessionPayloadFromCookies, getTenantPrisma } from './tenant-db'

function currentTenantPrisma() {
  const payload = getSessionPayloadFromCookies()
  if (!payload?.firmSchema) {
    throw new Error('Firm session is required.')
  }
  return getTenantPrisma(payload.firmSchema)
}

export const prisma = new Proxy({} as TenantPrismaClient, {
  get(_target, prop) {
    const client = currentTenantPrisma()
    const value = client[prop as keyof TenantPrismaClient]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
