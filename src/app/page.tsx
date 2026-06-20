import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

type ClientLedgerRow = {
  id: string
  name: string
  projects: number
  totalAmount: number
  paymentsReceived: number
  receivable: number
}

const DEFAULT_EXECUTION_FEE_PERCENT = 6

const getExecutionFeePercent = (quotation: { executionFeePercent?: number | null }) =>
  quotation.executionFeePercent ?? DEFAULT_EXECUTION_FEE_PERCENT

const getQuotationGrandTotal = (quotation: { amount?: number | null; executionFeePercent?: number | null }) => {
  const subtotal = Number(quotation.amount || 0)
  return subtotal + subtotal * (getExecutionFeePercent(quotation) / 100)
}

type VendorOutstandingRow = {
  vendorId: string
  vendorName: string
  projectName: string
  totalAmount: number
  totalPayments: number
  totalCharges: number
  remaining: number
}

export default async function Home() {
  const [clients, vendorAccounts, activeProjects, completedProjects, recentTransactions] = await Promise.all([
    prisma.client.findMany({
      include: {
        projects: { select: { id: true } },
        quotations: {
          where: { status: 'accepted' },
          select: { amount: true, executionFeePercent: true },
        },
        transactions: {
          where: { type: { in: ['payment', 'credit payment'] } },
          select: { amount: true },
        },
      },
      orderBy: { firstName: 'asc' },
    }),
    prisma.vendorAccount.findMany({
      where: {
        currentBalance: { gt: 0 },
      },
      include: {
        vendor: true,
        project: true,
        entries: true,
      },
      orderBy: [
        { vendor: { name: 'asc' } },
        { project: { name: 'asc' } },
      ],
    }),
    prisma.project.count({ where: { status: 'active' } }),
    prisma.project.count({ where: { status: 'completed' } }),
    prisma.transaction.findMany({
      include: {
        client: true,
        vendor: true,
        project: true,
      },
      orderBy: { date: 'desc' },
      take: 6,
    }),
  ])

  const clientLedger: ClientLedgerRow[] = clients.map((client) => {
    const totalAmount = client.quotations.reduce((sum, quotation) => sum + getQuotationGrandTotal(quotation), 0)
    const paymentsReceived = client.transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    const receivable = Math.max(totalAmount - paymentsReceived, 0)

    return {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`.trim(),
      projects: client.projects.length,
      totalAmount,
      paymentsReceived,
      receivable,
    }
  })

  const vendorOutstandingRows: VendorOutstandingRow[] = vendorAccounts.map((account) => {
    const totalPayments = account.entries
      .filter((entry) => entry.type.toLowerCase() === 'payment')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const totalCharges = account.entries
      .filter((entry) => entry.type.toLowerCase() !== 'payment')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

    return {
      vendorId: account.vendorId,
      vendorName: account.vendor.name,
      projectName: account.project.name,
      totalAmount: Number(account.openingBalance || 0) + totalCharges,
      totalPayments,
      totalCharges,
      remaining: Number(account.currentBalance || 0),
    }
  })

  const groupedVendorRows = vendorOutstandingRows.reduce((acc: Record<string, VendorOutstandingRow[]>, row) => {
    if (!acc[row.vendorId]) acc[row.vendorId] = []
    acc[row.vendorId].push(row)
    return acc
  }, {})

  const clientTotals = clientLedger.reduce(
    (acc, row) => {
      acc.totalAmount += row.totalAmount
      acc.paymentsReceived += row.paymentsReceived
      acc.receivable += row.receivable
      return acc
    },
    { totalAmount: 0, paymentsReceived: 0, receivable: 0 },
  )

  const vendorTotals = vendorOutstandingRows.reduce(
    (acc, row) => {
      acc.totalAmount += row.totalAmount
      acc.paymentsMade += row.totalPayments
      acc.remaining += row.remaining
      return acc
    },
    { totalAmount: 0, paymentsMade: 0, remaining: 0 },
  )

  return (
    <div className="space-y-8 py-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <SummaryTile title="All Clients Total Amount" value={formatCurrency(clientTotals.totalAmount)} note="Accepted quotation value across all clients" />
        <SummaryTile title="Payment Received Yet" value={formatCurrency(clientTotals.paymentsReceived)} note="Collected client payments till date" />
        <SummaryTile title="Payment Receivable" value={formatCurrency(clientTotals.receivable)} note="Amount still pending from clients" />
        <SummaryTile title="Active Projects" value={String(activeProjects)} note="Current live sites in progress" />
        <SummaryTile title="Vendor Outstanding" value={formatCurrency(vendorTotals.remaining)} note="Only vendor balances still payable" />
      </section>

      <section className="rounded-[24px] border border-[#d8e0ea] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfe_100%)] p-4 shadow-[0_18px_34px_rgba(28,50,76,0.09)] sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b7f9e]">Client Ledger</p>
            <h3 className="mt-2 text-xl font-bold text-[#1f3350] sm:text-2xl">All clients total, received, and receivable</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[#e3e9f0] text-left text-sm text-[#6b7f9e]">
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Projects</th>
                <th className="pb-3 text-right font-semibold">Total Amount</th>
                <th className="pb-3 text-right font-semibold">Payment Received</th>
                <th className="pb-3 text-right font-semibold">Receivable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ecf1f4]">
              {clientLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-[#70849b]">No client records found yet.</td>
                </tr>
              ) : (
                clientLedger.map((client) => (
                  <tr key={client.id}>
                    <td className="py-4 font-semibold text-[#1f3350]">{client.name}</td>
                    <td className="py-4 text-[#667b94]">{client.projects}</td>
                    <td className="py-4 text-right text-[#667b94]">{formatCurrency(client.totalAmount)}</td>
                    <td className="py-4 text-right text-[#17805e]">{formatCurrency(client.paymentsReceived)}</td>
                    <td className="py-4 text-right font-semibold text-[#bf8a3d]">{formatCurrency(client.receivable)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#d8e0ea] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfe_100%)] p-4 shadow-[0_18px_34px_rgba(28,50,76,0.09)] sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b7f9e]">Vendor Outstanding</p>
            <h3 className="mt-2 text-xl font-bold text-[#1f3350] sm:text-2xl">Project-wise vendor balances still payable</h3>
            <p className="mt-2 text-sm text-[#70849b]">Fully settled vendor accounts are hidden automatically.</p>
          </div>
        </div>

        {vendorOutstandingRows.length === 0 ? (
          <p className="rounded-2xl bg-[#f3f6fb] px-4 py-5 text-sm text-[#70849b]">No vendor balances are pending right now.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedVendorRows).map(([vendorId, rows]) => {
              const vendorName = rows[0]?.vendorName || 'Vendor'
              const vendorTotalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0)
              const vendorPayments = rows.reduce((sum, row) => sum + row.totalPayments, 0)
              const vendorRemaining = rows.reduce((sum, row) => sum + row.remaining, 0)

              return (
                <div key={vendorId} className="overflow-hidden rounded-[24px] border border-[#e0e7ef] bg-[#fbfcfe]">
                  <div className="flex flex-col gap-4 border-b border-[#e3e9f0] bg-[linear-gradient(135deg,#f6f8fc_0%,#eef3f8_100%)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
                    <div>
                      <h4 className="text-xl font-bold text-[#1f3350]">{vendorName}</h4>
                      <p className="mt-1 text-sm text-[#70849b]">{rows.length} active project balance{rows.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniMetric label="Total Amount" value={formatCurrency(vendorTotalAmount)} />
                      <MiniMetric label="Payment Made" value={formatCurrency(vendorPayments)} />
                      <MiniMetric label="Remaining" value={formatCurrency(vendorRemaining)} highlight />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b border-[#e3e9f0] text-left text-sm text-[#6b7f9e]">
                          <th className="px-5 py-3 font-semibold">Project</th>
                          <th className="px-5 py-3 text-right font-semibold">Total Amount</th>
                          <th className="px-5 py-3 text-right font-semibold">Payment Made</th>
                          <th className="px-5 py-3 text-right font-semibold">Extra Charges</th>
                          <th className="px-5 py-3 text-right font-semibold">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf1f5]">
                        {rows.map((row) => (
                          <tr key={`${row.vendorId}-${row.projectName}`}>
                            <td className="px-5 py-4 font-medium text-[#1f3350]">{row.projectName}</td>
                            <td className="px-5 py-4 text-right text-[#667b94]">{formatCurrency(row.totalAmount)}</td>
                            <td className="px-5 py-4 text-right text-[#17805e]">{formatCurrency(row.totalPayments)}</td>
                            <td className="px-5 py-4 text-right text-[#667b94]">{formatCurrency(row.totalCharges)}</td>
                            <td className="px-5 py-4 text-right font-semibold text-[#bf8a3d]">{formatCurrency(row.remaining)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-[#d8e0ea] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfe_100%)] p-4 shadow-[0_18px_34px_rgba(28,50,76,0.09)] sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b7f9e]">Recent Transactions</p>
            <h3 className="mt-2 text-xl font-bold text-[#1f3350] sm:text-2xl">Latest money movement</h3>
          </div>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="rounded-2xl bg-[#f3f6fb] px-4 py-5 text-sm text-[#70849b]">No transactions recorded yet.</p>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col gap-3 rounded-2xl border border-[#e0e7ef] bg-[#fbfcfe] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#1f3350]">{transaction.description}</p>
                  <p className="mt-1 text-sm text-[#70849b]">
                    {transaction.project?.name || transaction.client?.firstName || transaction.vendor?.name || 'General'} - {transaction.type}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-lg font-bold text-[#294a6d]">{formatCurrency(Number(transaction.amount))}</p>
                  <p className="text-sm text-[#70849b]">
                    {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SummaryTile title="Completed Projects" value={String(completedProjects)} note="Finished and closed projects" />
        <SummaryTile title="Vendor Payment Made" value={formatCurrency(vendorTotals.paymentsMade)} note="Payments already released to vendors" />
      </section>
    </div>
  )
}

function SummaryTile({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="min-w-0 rounded-[24px] border border-[#d8e0ea] bg-[linear-gradient(135deg,#ffffff_0%,#f3f6fb_55%,#eef1f7_100%)] p-4 shadow-[0_14px_30px_rgba(28,50,76,0.08)] sm:p-5">
      <p className="break-words text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f9e] sm:tracking-[0.28em]">{title}</p>
      <p className="mt-3 break-words text-2xl font-bold text-[#1f3350] sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#70849b]">{note}</p>
    </article>
  )
}

function MiniMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${highlight ? 'border-[#dfc086] bg-[linear-gradient(180deg,#fff8ef_0%,#f7efdf_100%)]' : 'border-[#d8e0ea] bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7f9e]">{label}</p>
      <p className={`mt-2 text-lg font-bold ${highlight ? 'text-[#bf8a3d]' : 'text-[#1f3350]'}`}>{value}</p>
    </div>
  )
}
