'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue } from '@/lib/text-format'

interface Project {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  status: string
  clientId: string
  client: {
    firstName: string
    lastName: string
  }
}

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface ProjectAccountSummary {
  acceptedTotal: number
  clientPaymentsTotal: number
  clientReceivable: number
  purchasesTotal: number
  vendorPaymentsTotal: number
  vendorChargesTotal: number
  otherExpensesTotal: number
  otherIncomeTotal: number
  totalExpenses: number
  totalCredits: number
  netProfitLoss: number
  receivedBalance: number
}

interface ProjectAccountEntry {
  id: string
  type: string
  amount: number
  description: string
  date: string
}

interface ProjectAccountVendor {
  id: string
  vendorId: string
  vendorName: string
  openingBalance: number
  currentBalance: number
  paymentsTotal: number
  chargesTotal: number
  notes?: string
  status: string
  entries: ProjectAccountEntry[]
}

interface ProjectAccountTransaction {
  id: string
  type: string
  amount: number
  description: string
  date: string
}

interface ProjectPurchase {
  id: string
  purchaseNo: string
  amount: number
  status: string
  purchaseDate: string
  items: string
  vendor: {
    name: string
  }
}

interface ProjectQuotation {
  id: string
  quotationNo: string
  amount: number
  issueDate: string
  status: string
}

interface ProjectAccountReport {
  project: Project
  summary: ProjectAccountSummary
  acceptedQuotations: ProjectQuotation[]
  clientPayments: ProjectAccountTransaction[]
  purchases: ProjectPurchase[]
  transactions: ProjectAccountTransaction[]
  vendorAccounts: ProjectAccountVendor[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountReport, setAccountReport] = useState<ProjectAccountReport | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    address: '',
    city: '',
    status: 'active'
  })

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [])

  const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingProject(null)
        setFormData({
          name: '',
          description: '',
          clientId: '',
          address: '',
          city: '',
          status: 'active'
        })
        fetchProjects()
      } else {
        console.error('Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      clientId: project.clientId,
      address: project.address || '',
      city: project.city || '',
      status: project.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchProjects()
        } else {
          console.error('Failed to delete project')
        }
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: getNormalizedFieldValue(e.target)
    })
  }

  const openAddModal = () => {
    setEditingProject(null)
    setFormData({
      name: '',
      description: '',
      clientId: '',
      address: '',
      city: '',
      status: 'active'
    })
    setShowModal(true)
  }

  const openAccountModal = async (project: Project) => {
    setShowAccountModal(true)
    setAccountLoading(true)
    setAccountReport(null)

    try {
      const res = await fetch(`/api/projects/${project.id}/account-report`)
      const data = await res.json()
      if (res.ok) {
        setAccountReport(data)
      } else {
        console.error('Failed to fetch project account report', data)
      }
    } catch (error) {
      console.error('Failed to fetch project account report:', error)
    } finally {
      setAccountLoading(false)
    }
  }

  const printAccountReport = () => {
    if (!accountReport) return
    const logoUrl = `${window.location.origin}/dashboard-logo.png`

    const quotationRows = accountReport.acceptedQuotations.map((quotation) => `
      <tr>
        <td>${escapeHtml(quotation.quotationNo)}</td>
        <td>${formatDate(quotation.issueDate)}</td>
        <td style="text-align:right;">${formatCurrency(Number(quotation.amount))}</td>
      </tr>
    `).join('')

    const clientPaymentRows = accountReport.clientPayments.map((payment) => `
      <tr>
        <td>${formatDate(payment.date)}</td>
        <td>${escapeHtml(payment.description || 'Client payment')}</td>
        <td style="text-align:right;">${formatCurrency(Number(payment.amount))}</td>
      </tr>
    `).join('')

    const vendorRows = accountReport.vendorAccounts.map((account) => `
      <tr>
        <td>${escapeHtml(account.vendorName)}</td>
        <td style="text-align:right;">${formatCurrency(Number(account.openingBalance) + Number(account.chargesTotal))}</td>
        <td style="text-align:right;">${formatCurrency(Number(account.paymentsTotal))}</td>
        <td style="text-align:right;">${formatCurrency(Number(account.currentBalance))}</td>
      </tr>
    `).join('')
    const vendorRemainingTotal = accountReport.vendorAccounts.reduce(
      (sum, account) => sum + Number(account.currentBalance),
      0,
    )

    const transactionRows = accountReport.transactions.map((transaction) => `
      <tr>
        <td>${formatDate(transaction.date)}</td>
        <td>${escapeHtml(transaction.type)}</td>
        <td>${escapeHtml(transaction.description || '-')}</td>
        <td style="text-align:right;">${formatCurrency(Number(transaction.amount))}</td>
      </tr>
    `).join('')

    const reportWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!reportWindow) return

    reportWindow.document.write(`
      <html>
        <head>
          <title>Project Account Report</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #111827;
              background: #ffffff;
              font-size: 10px;
              line-height: 1.35;
            }
            h1, h2, h3, p { margin: 0; }
            h1 { font-size: 18px; line-height: 1.15; }
            h2 { margin-top: 3px; font-size: 12px; font-weight: 600; color: #374151; }
            h3 {
              margin: 12px 0 6px;
              font-size: 12px;
              line-height: 1.2;
              color: #111827;
              page-break-after: avoid;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
              border-bottom: 1px solid #b9894e;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .brand-logo {
              width: 58px;
              height: 58px;
              border-radius: 10px;
              overflow: hidden;
              background: #1d2330;
              flex: 0 0 auto;
            }
            .brand-logo img { display: block; width: 100%; height: 100%; object-fit: cover; }
            .brand-name {
              font-size: 18px;
              line-height: 1.1;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              color: #9b5b20;
            }
            .brand-subtitle { margin-top: 2px; color: #6b5642; font-size: 10px; }
            .project-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px 14px;
              margin: 8px 0 10px;
              color: #374151;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 6px;
              margin: 10px 0 12px;
            }
            .card {
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 7px 8px;
              min-height: 46px;
              page-break-inside: avoid;
            }
            .label {
              font-size: 7.8px;
              line-height: 1.2;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: #6b7280;
            }
            .value {
              margin-top: 4px;
              font-size: 12px;
              line-height: 1.15;
              font-weight: 700;
              color: #111827;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 10px;
              table-layout: fixed;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid; }
            th, td {
              border: 1px solid #d1d5db;
              padding: 4px 5px;
              text-align: left;
              vertical-align: top;
              overflow-wrap: anywhere;
            }
            th {
              background: #f3f4f6;
              font-size: 9px;
              font-weight: 700;
            }
            td { font-size: 9px; }
            .amount { text-align: right; white-space: nowrap; }
            .section { page-break-inside: avoid; }
            @media print {
              body { font-size: 10px; }
              .brand, .grid, .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="brand">
            <div class="brand-logo"><img src="${logoUrl}" alt="Space Shastra logo" /></div>
            <div>
              <div class="brand-name">Space Shastra Interiors</div>
              <div class="brand-subtitle">Project account statement</div>
            </div>
          </div>
          <h1>Project Account Report</h1>
          <h2>${escapeHtml(accountReport.project.name)}</h2>
          <div class="project-meta">
            <p><strong>Client:</strong> ${escapeHtml(accountReport.project.client.firstName)} ${escapeHtml(accountReport.project.client.lastName)}</p>
            <p><strong>Status:</strong> ${escapeHtml(accountReport.project.status)}</p>
            <p><strong>Location:</strong> ${escapeHtml(accountReport.project.city || accountReport.project.address || '-')}</p>
          </div>

          <div class="grid">
            <div class="card"><div class="label">Final Project Value</div><div class="value">${formatCurrency(accountReport.summary.acceptedTotal)}</div></div>
            <div class="card"><div class="label">Client Payments Received</div><div class="value">${formatCurrency(accountReport.summary.clientPaymentsTotal)}</div></div>
            <div class="card"><div class="label">Total Expenses</div><div class="value">${formatCurrency(accountReport.summary.totalExpenses)}</div></div>
            <div class="card"><div class="label">Amount Remaining From Received</div><div class="value">${formatCurrency(accountReport.summary.receivedBalance)}</div></div>
            <div class="card"><div class="label">Profit / Loss</div><div class="value">${formatCurrency(accountReport.summary.netProfitLoss)}</div></div>
          </div>

          <div class="section">
          <h3>Accepted Quotations</h3>
          <table>
            <thead><tr><th>Quotation No</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>${quotationRows || '<tr><td colspan="3" style="text-align:center;">No accepted quotations.</td></tr>'}</tbody>
          </table>
          </div>

          <div class="section">
          <h3>Client Payments</h3>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>${clientPaymentRows || '<tr><td colspan="3" style="text-align:center;">No project-linked client payments yet.</td></tr>'}</tbody>
          </table>
          </div>

          <div class="section">
          <h3>Vendor Accounts</h3>
          <table>
            <thead><tr><th>Vendor</th><th>Total Amount</th><th>Paid</th><th>Remaining</th></tr></thead>
            <tbody>
              ${vendorRows || '<tr><td colspan="4" style="text-align:center;">No vendor account data yet.</td></tr>'}
              <tr>
                <td colspan="3" style="text-align:right;"><strong>Total Remaining</strong></td>
                <td style="text-align:right;"><strong>${formatCurrency(vendorRemainingTotal)}</strong></td>
              </tr>
            </tbody>
          </table>
          </div>

          <div class="section">
          <h3>Other Project Transactions</h3>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>${transactionRows || '<tr><td colspan="4" style="text-align:center;">No other transactions yet.</td></tr>'}</tbody>
          </table>
          </div>
        </body>
      </html>
    `)
    reportWindow.document.close()

    const images = Array.from(reportWindow.document.images)
    const printWhenReady = () => {
      reportWindow.focus()
      reportWindow.print()
    }

    if (images.length === 0) {
      printWhenReady()
      return
    }

    Promise.all(
      images.map((image) => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve()
        return new Promise<void>((resolve) => {
          image.onload = () => resolve()
          image.onerror = () => resolve()
        })
      }),
    ).then(() => {
      window.setTimeout(printWhenReady, 250)
    })
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Projects/Sites</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Project
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black bg-opacity-50 py-10">
          <div className="w-full max-w-6xl rounded-lg bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Project Account Report</h3>
                <p className="text-sm text-gray-600">
                  {accountReport ? `${accountReport.project.name} - ${accountReport.project.client.firstName} ${accountReport.project.client.lastName}` : 'Loading project report...'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={printAccountReport}
                  disabled={!accountReport}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>

            {accountLoading ? (
              <p>Loading project account report...</p>
            ) : !accountReport ? (
              <p className="text-sm text-red-600">Unable to load project account report.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Final Project Value</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(accountReport.summary.acceptedTotal)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Client Payments Received</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(accountReport.summary.clientPaymentsTotal)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Total Expenses</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(accountReport.summary.totalExpenses)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Amount Remaining From Received</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(accountReport.summary.receivedBalance)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-700">Client Receivable</p>
                    <p className="mt-2 text-xl font-semibold text-blue-950">{formatCurrency(accountReport.summary.clientReceivable)}</p>
                  </div>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-orange-700">Profit / Loss</p>
                    <p className="mt-2 text-xl font-semibold text-orange-950">{formatCurrency(accountReport.summary.netProfitLoss)}</p>
                  </div>
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-rose-700">Vendor Payments + Charges</p>
                    <p className="mt-2 text-xl font-semibold text-rose-950">
                      {formatCurrency(accountReport.summary.vendorPaymentsTotal + accountReport.summary.vendorChargesTotal)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-600">Other Expenses + Income</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {formatCurrency(accountReport.summary.otherExpensesTotal - accountReport.summary.otherIncomeTotal)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-3 text-lg font-semibold">Accepted Quotations</h4>
                  {accountReport.acceptedQuotations.length === 0 ? (
                    <p className="text-sm text-gray-600">No accepted quotations linked to this project yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Quotation No</th>
                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-900">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {accountReport.acceptedQuotations.map((quotation) => (
                            <tr key={quotation.id}>
                              <td className="px-3 py-2">{quotation.quotationNo}</td>
                              <td className="px-3 py-2">{formatDate(quotation.issueDate)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(quotation.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-3 text-lg font-semibold">Client Payments</h4>
                  <p className="mb-3 text-sm text-gray-600">
                    Record project-wise client receipts from the Transactions page using `Credit Payment` with this project selected.
                  </p>
                  {accountReport.clientPayments.length === 0 ? (
                    <p className="text-sm text-gray-600">No client payments recorded against this project yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                            <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Description</th>
                            <th className="px-3 py-2 text-right text-sm font-medium text-gray-900">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {accountReport.clientPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-3 py-2">{formatDate(payment.date)}</td>
                              <td className="px-3 py-2">{payment.description || 'Client payment'}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(payment.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 text-lg font-semibold">Purchases</h4>
                    {accountReport.purchases.length === 0 ? (
                      <p className="text-sm text-gray-600">No purchases created for this project yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {accountReport.purchases.map((purchase) => (
                          <div key={purchase.id} className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium">{purchase.purchaseNo}</p>
                                <p className="text-sm text-gray-600">{purchase.vendor.name}</p>
                                <p className="text-sm text-gray-500">{purchase.items}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(purchase.amount)}</p>
                                <p className="text-sm text-gray-500">{formatDate(purchase.purchaseDate)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="mb-3 text-lg font-semibold">Other Project Transactions</h4>
                    {accountReport.transactions.length === 0 ? (
                      <p className="text-sm text-gray-600">No extra project transactions recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {accountReport.transactions.map((transaction) => (
                          <div key={transaction.id} className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium capitalize">{transaction.type}</p>
                                <p className="text-sm text-gray-600">{transaction.description || '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-3 text-lg font-semibold">Vendor Account Breakdown</h4>
                  {accountReport.vendorAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600">No vendor accounts created for this project yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {accountReport.vendorAccounts.map((account) => (
                        <div key={account.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{account.vendorName}</p>
                              <p className="text-sm text-gray-600">Status: {account.status}</p>
                              {account.notes && <p className="text-sm text-gray-500">{account.notes}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-right sm:grid-cols-3 sm:gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
                                <p className="font-semibold">{formatCurrency(account.openingBalance + account.chargesTotal)}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Paid</p>
                                <p className="font-semibold">{formatCurrency(account.paymentsTotal)}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Remaining</p>
                                <p className="font-semibold">{formatCurrency(account.currentBalance)}</p>
                              </div>
                            </div>
                          </div>

                          {account.entries.length === 0 ? (
                            <p className="text-sm text-gray-600">No vendor entries recorded.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Type</th>
                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Description</th>
                                    <th className="px-3 py-2 text-right text-sm font-medium text-gray-900">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {account.entries.map((entry) => (
                                    <tr key={entry.id}>
                                      <td className="px-3 py-2">{formatDate(entry.date)}</td>
                                      <td className="px-3 py-2 capitalize">{entry.type}</td>
                                      <td className="px-3 py-2">{entry.description || '-'}</td>
                                      <td className="px-3 py-2 text-right">{formatCurrency(entry.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Location</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-3">{project.name}</td>
                  <td className="px-6 py-3">{project.client.firstName} {project.client.lastName}</td>
                  <td className="px-6 py-3">{project.city || project.address}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => openAccountModal(project)}
                      className="mr-4 text-indigo-600 hover:underline"
                    >
                      Account
                    </button>
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
