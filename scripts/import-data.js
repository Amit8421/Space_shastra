const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const importPath = process.argv.find((arg) => !arg.startsWith('--') && arg.endsWith('.json')) || path.join(process.cwd(), 'database-export.json')
const shouldClear = process.argv.includes('--clear')

const dateFieldsByTable = {
  users: ['createdAt', 'updatedAt'],
  clients: ['createdAt', 'updatedAt'],
  vendors: ['createdAt', 'updatedAt'],
  projects: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
  invoices: ['issueDate', 'dueDate', 'createdAt', 'updatedAt'],
  invoiceItems: ['createdAt'],
  payments: ['paymentDate', 'createdAt'],
  quotations: ['issueDate', 'dueDate', 'createdAt', 'updatedAt'],
  quotationItems: ['createdAt'],
  transactions: ['date', 'createdAt', 'updatedAt'],
  purchases: ['purchaseDate', 'dueDate', 'createdAt', 'updatedAt'],
  vendorAccounts: ['createdAt', 'updatedAt'],
  vendorAccountEntries: ['date', 'createdAt', 'updatedAt'],
  vendorAccountFurnitureItems: ['createdAt', 'updatedAt'],
}

const importOrder = [
  ['users', prisma.user],
  ['clients', prisma.client],
  ['vendors', prisma.vendor],
  ['projects', prisma.project],
  ['invoices', prisma.invoice],
  ['invoiceItems', prisma.invoiceItem],
  ['payments', prisma.payment],
  ['quotations', prisma.quotation],
  ['quotationItems', prisma.quotationItem],
  ['transactions', prisma.transaction],
  ['purchases', prisma.purchase],
  ['vendorAccounts', prisma.vendorAccount],
  ['vendorAccountEntries', prisma.vendorAccountEntry],
  ['vendorAccountFurnitureItems', prisma.vendorAccountFurnitureItem],
]

const clearOrder = [...importOrder].reverse()

function reviveDates(table, rows = []) {
  const dateFields = dateFieldsByTable[table] || []
  return rows.map((row) => {
    const nextRow = { ...row }
    for (const field of dateFields) {
      if (nextRow[field]) nextRow[field] = new Date(nextRow[field])
    }
    return nextRow
  })
}

async function main() {
  if (!fs.existsSync(importPath)) {
    throw new Error(`Import file not found: ${importPath}`)
  }

  const data = JSON.parse(fs.readFileSync(importPath, 'utf8'))

  if (shouldClear) {
    for (const [key, model] of clearOrder) {
      await model.deleteMany()
      console.log(`Cleared ${key}`)
    }
  }

  for (const [key, model] of importOrder) {
    const rows = reviveDates(key, data[key] || [])
    if (rows.length === 0) {
      console.log(`Skipped ${key} (0 rows)`)
      continue
    }

    await model.createMany({
      data: rows,
      skipDuplicates: true,
    })
    console.log(`Imported ${key} (${rows.length} rows)`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
