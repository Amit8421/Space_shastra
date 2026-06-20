const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const exportPath = process.argv[2] || path.join(process.cwd(), 'database-export.json')

const tables = [
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

async function main() {
  const data = {}

  for (const [key, model] of tables) {
    data[key] = await model.findMany()
  }

  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2))
  console.log(`Exported database data to ${exportPath}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
