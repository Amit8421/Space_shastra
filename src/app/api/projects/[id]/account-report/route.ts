import { NextResponse } from 'next/server'
import { prisma } from '@/lib/tenant-prisma-proxy'

const getQuotationGrandTotal = (quotation: { amount?: unknown }) => Number(quotation.amount || 0)

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        client: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const [acceptedQuotations, purchases, transactions, vendorAccounts, clientProjectCount] = await Promise.all([
      prisma.quotation.findMany({
        where: {
          projectId: params.id,
          status: 'accepted',
        },
        orderBy: { issueDate: 'desc' },
      }),
      prisma.purchase.findMany({
        where: {
          projectId: params.id,
        },
        include: {
          vendor: true,
        },
        orderBy: { purchaseDate: 'desc' },
      }),
      prisma.transaction.findMany({
        where: {
          projectId: params.id,
          type: {
            not: 'credit payment',
          },
        },
        include: {
          vendor: true,
          client: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.vendorAccount.findMany({
        where: {
          projectId: params.id,
        },
        include: {
          vendor: true,
          entries: {
            orderBy: { date: 'desc' },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.project.count({
        where: {
          clientId: project.clientId,
        },
      }),
    ])

    const clientPayments = await prisma.transaction.findMany({
      where: {
        clientId: project.clientId,
        type: { in: ['credit payment', 'payment'] },
        OR: [
          { projectId: params.id },
          ...(clientProjectCount === 1 ? [{ projectId: null }] : []),
        ],
      },
      include: {
        client: true,
        project: true,
      },
      orderBy: { date: 'desc' },
    })

    const acceptedQuotationRows = acceptedQuotations.map((quotation) => ({
      ...quotation,
      amount: getQuotationGrandTotal(quotation),
    }))
    const acceptedTotal = acceptedQuotationRows.reduce((sum, quotation) => sum + Number(quotation.amount), 0)
    const clientPaymentsTotal = clientPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const purchasesTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0)

    const otherProjectTransactions = transactions.filter((transaction) =>
      !(transaction.vendorId && ['expense', 'purchase', 'payment'].includes(transaction.type))
    )

    const expenseTransactions = otherProjectTransactions.filter((transaction) =>
      ['expense', 'purchase', 'payment'].includes(transaction.type)
    )
    const incomeTransactions = otherProjectTransactions.filter((transaction) => transaction.type === 'income')

    const otherExpensesTotal = expenseTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const otherIncomeTotal = incomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)

    const vendorAccountSummaries = vendorAccounts.map((account) => {
      const paymentsTotal = account.entries
        .filter((entry) => entry.type === 'payment')
        .reduce((sum, entry) => sum + Number(entry.amount), 0)
      const chargesTotal = account.entries
        .filter((entry) => entry.type === 'charge')
        .reduce((sum, entry) => sum + Number(entry.amount), 0)

      return {
        id: account.id,
        vendorId: account.vendorId,
        vendorName: account.vendor.name,
        openingBalance: account.openingBalance,
        currentBalance: account.currentBalance,
        paymentsTotal,
        chargesTotal,
        notes: account.notes,
        status: account.status,
        entries: account.entries,
      }
    })

    const vendorPaymentsTotal = vendorAccountSummaries.reduce((sum, account) => sum + account.paymentsTotal, 0)
    const vendorChargesTotal = vendorAccountSummaries.reduce((sum, account) => sum + account.chargesTotal, 0)
    const totalExpenses = purchasesTotal + otherExpensesTotal + vendorPaymentsTotal + vendorChargesTotal
    const totalCredits = acceptedTotal + otherIncomeTotal
    const netProfitLoss = totalCredits - totalExpenses
    const receivedBalance = clientPaymentsTotal - totalExpenses
    const clientReceivable = acceptedTotal - clientPaymentsTotal

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        address: project.address,
        city: project.city,
        status: project.status,
        client: project.client,
      },
      summary: {
        acceptedTotal,
        clientPaymentsTotal,
        clientReceivable,
        purchasesTotal,
        vendorPaymentsTotal,
        vendorChargesTotal,
        otherExpensesTotal,
        otherIncomeTotal,
        totalExpenses,
        totalCredits,
        netProfitLoss,
        receivedBalance,
      },
      acceptedQuotations: acceptedQuotationRows,
      clientPayments,
      purchases,
      transactions: otherProjectTransactions,
      vendorAccounts: vendorAccountSummaries,
    })
  } catch (error) {
    console.error('Failed to fetch project account report:', error)
    return NextResponse.json({ error: 'Failed to fetch project account report' }, { status: 500 })
  }
}

