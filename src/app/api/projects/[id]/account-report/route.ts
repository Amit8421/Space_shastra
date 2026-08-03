import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getQuotationGrandTotal } from '@/lib/quotation-total'

const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100

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
          status: { not: 'cancelled' },
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
    const acceptedTotal = roundCurrency(acceptedQuotationRows.reduce((sum, quotation) => sum + Number(quotation.amount), 0))
    const clientPaymentsTotal = roundCurrency(clientPayments.reduce((sum, payment) => sum + Number(payment.amount), 0))
    const purchasesTotal = roundCurrency(purchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0))

    const otherProjectTransactions = transactions.filter((transaction) =>
      !(transaction.clientId && ['credit payment', 'payment'].includes(transaction.type)) &&
      !(transaction.vendorId && ['expense', 'purchase', 'payment'].includes(transaction.type))
    )

    const expenseTransactions = otherProjectTransactions.filter((transaction) =>
      ['expense', 'purchase', 'payment'].includes(transaction.type)
    )
    const incomeTransactions = otherProjectTransactions.filter((transaction) => transaction.type === 'income')

    const otherExpensesTotal = roundCurrency(expenseTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0))
    const otherIncomeTotal = roundCurrency(incomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0))

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

    const vendorContractCostTotal = roundCurrency(
      vendorAccountSummaries.reduce((sum, account) => sum + Number(account.openingBalance), 0),
    )
    const vendorPaymentsTotal = roundCurrency(
      vendorAccountSummaries.reduce((sum, account) => sum + account.paymentsTotal, 0),
    )
    const vendorChargesTotal = roundCurrency(
      vendorAccountSummaries.reduce((sum, account) => sum + account.chargesTotal, 0),
    )
    const vendorCostTotal = roundCurrency(vendorContractCostTotal + vendorChargesTotal)
    const vendorOutstandingTotal = roundCurrency(
      vendorAccountSummaries.reduce((sum, account) => sum + Number(account.currentBalance), 0),
    )
    const totalProjectCost = roundCurrency(purchasesTotal + vendorCostTotal + otherExpensesTotal)
    const totalProjectIncome = roundCurrency(acceptedTotal + otherIncomeTotal)
    const estimatedProjectProfit = roundCurrency(totalProjectIncome - totalProjectCost)
    const cashRemaining = roundCurrency(
      clientPaymentsTotal + otherIncomeTotal - vendorPaymentsTotal - otherExpensesTotal,
    )
    const clientReceivable = roundCurrency(acceptedTotal - clientPaymentsTotal)

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
        vendorContractCostTotal,
        vendorPaymentsTotal,
        vendorChargesTotal,
        vendorCostTotal,
        vendorOutstandingTotal,
        otherExpensesTotal,
        otherIncomeTotal,
        totalProjectCost,
        totalProjectIncome,
        estimatedProjectProfit,
        cashRemaining,
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
