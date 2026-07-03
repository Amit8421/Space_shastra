import { Prisma, PrismaClient } from '@prisma/client'
import { getAuditRequestContext, sanitizeAuditValue } from './audit'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

(Prisma.Decimal.prototype as unknown as { toJSON: () => number }).toJSON = function toJSON(this: Prisma.Decimal) {
  return this.toNumber()
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (!globalForPrisma.prisma) {
  prisma.$use(async (params, next) => {
    const trackedActions = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'])
    const result = await next(params)
    if (!params.model || params.model === 'AuditLog' || !trackedActions.has(params.action)) return result

    const requestContext = getAuditRequestContext()
    const resultRecord = result && typeof result === 'object' && !Array.isArray(result) ? result as Record<string, unknown> : undefined
    await prisma.auditLog.create({
      data: {
        userId: requestContext.userId,
        action: params.action.toUpperCase(),
        entityType: params.model,
        entityId: typeof resultRecord?.id === 'string' ? resultRecord.id : undefined,
        after: sanitizeAuditValue(result) as Prisma.InputJsonValue,
        metadata: sanitizeAuditValue({ where: params.args?.where }) as Prisma.InputJsonValue,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      },
    }).catch((auditError) => console.error('Audit log write failed:', auditError))

    return result
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
