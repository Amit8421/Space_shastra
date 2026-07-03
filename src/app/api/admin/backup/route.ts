import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [users, clients, vendors, projects, invoices, quotations, purchases, transactions, vendorAccounts, auditLogs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.client.findMany(),
    prisma.vendor.findMany(),
    prisma.project.findMany(),
    prisma.invoice.findMany({ include: { items: true, payments: true } }),
    prisma.quotation.findMany({ include: { items: true } }),
    prisma.purchase.findMany(),
    prisma.transaction.findMany(),
    prisma.vendorAccount.findMany({ include: { entries: true, furnitureItems: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } }),
  ])
  const exportedAt = new Date()
  const body = JSON.stringify({
    metadata: { schemaVersion: 2, exportedAt: exportedAt.toISOString(), source: 'Space Shastra Interiors' },
    data: { users, clients, vendors, projects, invoices, quotations, purchases, transactions, vendorAccounts, auditLogs },
  }, null, 2)
  const date = exportedAt.toISOString().slice(0, 10)
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="space-shastra-backup-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
