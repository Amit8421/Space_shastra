import { NextRequest, NextResponse } from 'next/server'
import { prisma as platformPrisma } from '@/lib/db'
import { getSessionPayloadFromRequest, getTenantPrisma } from '@/lib/tenant-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = getSessionPayloadFromRequest(request)
  if (!session?.firmSchema) return NextResponse.json({ error: 'Firm session is required.' }, { status: 401 })

  const tenantPrisma = getTenantPrisma(session.firmSchema)
  const [firm, users, clients, vendors, projects, invoices, quotations, purchases, transactions, vendorAccounts, auditLogs] = await Promise.all([
    platformPrisma.firm.findUnique({ where: { id: session.firmId }, select: { id: true, name: true, slug: true, schemaName: true, status: true, createdAt: true, updatedAt: true } }),
    platformPrisma.user.findMany({ where: { firmId: session.firmId }, select: { id: true, username: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true } }),
    tenantPrisma.client.findMany(),
    tenantPrisma.vendor.findMany(),
    tenantPrisma.project.findMany(),
    tenantPrisma.invoice.findMany({ include: { items: true, payments: true } }),
    tenantPrisma.quotation.findMany({ include: { items: true } }),
    tenantPrisma.purchase.findMany(),
    tenantPrisma.transaction.findMany(),
    tenantPrisma.vendorAccount.findMany({ include: { entries: true, furnitureItems: true } }),
    platformPrisma.auditLog.findMany({ where: { user: { firmId: session.firmId } }, orderBy: { createdAt: 'asc' } }),
  ])
  const exportedAt = new Date()
  const body = JSON.stringify({
    metadata: { schemaVersion: 3, exportedAt: exportedAt.toISOString(), product: 'InteriorOps Suite', firm },
    data: { users, clients, vendors, projects, invoices, quotations, purchases, transactions, vendorAccounts, auditLogs },
  }, null, 2)
  const date = exportedAt.toISOString().slice(0, 10)
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${session.firmSlug}-backup-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
