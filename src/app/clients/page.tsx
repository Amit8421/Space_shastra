'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue } from '@/lib/text-format'
import { fetchWithAuth } from '@/lib/fetch-with-auth'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  status: string
  balance: number
}

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  date: string
  project?: {
    id: string
    name: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Project {
  id: string
  name: string
  clientId: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [reconcileMessage, setReconcileMessage] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active'
  })
  const [accountClient, setAccountClient] = useState<Client | null>(null)
  const [clientProjects, setClientProjects] = useState<Project[]>([])
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([])
  const [accountSummary, setAccountSummary] = useState({
    acceptedTotal: 0,
    paymentsTotal: 0,
    remainingTotal: 0,
  })
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountForm, setAccountForm] = useState({
    amount: '',
    description: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async (selectedClientId?: string) => {
    try {
      setLoadError('')
      const res = await fetchWithAuth('/api/clients')
      if (!res.ok) {
        throw new Error(`Client request failed with status ${res.status}`)
      }

      const responseData: unknown = await res.json()
      if (!Array.isArray(responseData)) {
        throw new Error('Client request returned an invalid response')
      }

      const data = responseData as Client[]
      setClients(data)
      if (selectedClientId) {
        const updatedClient = data.find((client) => client.id === selectedClientId) || null
        setAccountClient(updatedClient)
      }
      return data
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      setClients([])
      setLoadError('Unable to load clients. Please refresh the page or sign in again.')
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEditing = Boolean(editingClient)
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const res = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const savedClient = await res.json() as Client
        setClients((currentClients) => isEditing
          ? currentClients.map((client) => client.id === savedClient.id ? savedClient : client)
          : [savedClient, ...currentClients])
        setShowModal(false)
        setEditingClient(null)
        setFormData({ firstName: '', lastName: '', email: '', phone: '', status: 'active' })
      } else {
        console.error(isEditing ? 'Failed to update client' : 'Failed to create client')
      }
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      status: client.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Delete this client?')) return
    try {
      const res = await fetchWithAuth(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (res.ok) {
        setClients((currentClients) => currentClients.filter((client) => client.id !== clientId))
      } else {
        console.error('Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleAccountFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAccountForm({
      ...accountForm,
      [e.target.name]: getNormalizedFieldValue(e.target),
    })
  }

  const fetchClientAccountReport = async (clientId: string) => {
    const res = await fetchWithAuth(`/api/clients/${clientId}/account-report`)
    if (!res.ok) throw new Error('Failed to load client account report')
    const data = await res.json()
    setClientProjects(Array.isArray(data.projects) ? data.projects : [])
    setAccountTransactions(Array.isArray(data.transactions) ? data.transactions : [])
    setAccountSummary(data.summary || { acceptedTotal: 0, paymentsTotal: 0, remainingTotal: 0 })
    return data
  }

  const openAccountModal = async (client: Client) => {
    setAccountClient(client)
    setClientProjects([])
    setAccountSummary({ acceptedTotal: 0, paymentsTotal: 0, remainingTotal: 0 })
    setAccountTransactions([])
    setAccountForm({ amount: '', description: '', projectId: '', date: new Date().toISOString().split('T')[0] })
    setAccountLoading(true)
    setAccountModalOpen(true)

    try {
      const data = await fetchClientAccountReport(client.id)
      const projects = Array.isArray(data.projects) ? data.projects : []
      if (projects.length === 1) {
        setAccountForm((currentForm) => ({ ...currentForm, projectId: projects[0].id }))
      }
      const remainingTotal = Number(data.summary?.remainingTotal || 0)
      setClients((currentClients) => currentClients.map((item) =>
        item.id === client.id ? { ...item, balance: remainingTotal } : item,
      ))
      setAccountClient((currentClient) => currentClient ? { ...currentClient, balance: remainingTotal } : currentClient)
    } catch (error) {
      console.error('Failed to load client account:', error)
    } finally {
      setAccountLoading(false)
    }
  }

  const handleAccountPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountClient) return
    const amount = parseFloat(accountForm.amount) || 0
    if (amount <= 0) return

    try {
      const res = await fetchWithAuth('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit payment',
          clientId: accountClient.id,
          amount,
          description: accountForm.description || 'Client payment',
          date: accountForm.date,
          vendorId: null,
          projectId: accountForm.projectId || null,
          notes: accountForm.description || 'Client payment',
        }),
      })

      if (res.ok) {
        const savedTransaction = await res.json() as Transaction
        setAccountTransactions((transactions) => [savedTransaction, ...transactions])
        setAccountSummary((summary) => ({
          ...summary,
          paymentsTotal: summary.paymentsTotal + amount,
          remainingTotal: Math.round((summary.remainingTotal - amount + Number.EPSILON) * 100) / 100,
        }))
        setClients((currentClients) => currentClients.map((client) =>
          client.id === accountClient.id ? { ...client, balance: Number(client.balance || 0) - amount } : client,
        ))
        setAccountClient((client) => client ? { ...client, balance: Number(client.balance || 0) - amount } : client)
        setAccountForm({
          amount: '',
          description: '',
          projectId: clientProjects.length === 1 ? clientProjects[0].id : '',
          date: new Date().toISOString().split('T')[0],
        })
      } else {
        const errorBody = await res.json().catch(() => null)
        console.error('Failed to record client payment', { status: res.status, body: errorBody })
      }
    } catch (error) {
      console.error('Error saving client payment:', error)
    }
  }

  const printAccountReport = () => {
    if (!accountClient) return
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) return
    const logoUrl = `${window.location.origin}/dashboard-logo.png`

    const rows = accountTransactions.map((transaction) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(transaction.date).toLocaleDateString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${transaction.type}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${transaction.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${transaction.amount.toFixed(2)}</td>
      </tr>
    `).join('')

    reportWindow.document.write(`
      <html>
        <head>
          <title>Client Account Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f1711; }
            h1, h2, h3, p { margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f7f7f7; text-align: left; }
            .brand { display:flex; align-items:center; gap:16px; border-bottom: 2px solid #8b4d20; padding-bottom: 16px; margin-bottom: 20px; }
            .brand-logo { width: 120px; border-radius: 18px; overflow: hidden; background: #1d2330; }
            .brand-logo img { display:block; width:100%; height:auto; }
            .brand-name { font-size: 28px; font-weight: 700; color: #c87926; letter-spacing: 0.08em; text-transform: uppercase; }
            .brand-tag { color: #6b5642; }
          </style>
        </head>
        <body>
          <div class="brand">
            <div class="brand-logo"><img src="${logoUrl}" alt="Space Shastra logo" /></div>
            <div>
              <div class="brand-name">Space Shastra Interiors</div>
              <div class="brand-tag">Client account statement</div>
              <div class="brand-tag"><strong>GSTIN:</strong> 27BRJPB7632L1ZI</div>
            </div>
          </div>
          <h1>Client Account Report</h1>
          <h2>${accountClient.firstName} ${accountClient.lastName}</h2>
          <p><strong>Total Accepted Amount:</strong> ₹${accountSummary.acceptedTotal.toFixed(2)}</p>
          <p><strong>Payments Received:</strong> ₹${accountSummary.paymentsTotal.toFixed(2)}</p>
          <p><strong>Remaining Balance:</strong> ₹${accountSummary.remainingTotal.toFixed(2)}</p>
          <h3>Account Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="4" style="padding: 8px; text-align: center;">No transactions yet.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.print()
    reportWindow.close()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: getNormalizedFieldValue(e.target)
    })
  }

  return (
    <div className="min-w-0 py-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-3xl font-bold">Clients</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Client
          </button>
          <button
            onClick={async () => {
              setReconcileMessage('')
              setReconciling(true)
              try {
                const res = await fetchWithAuth('/api/clients/reconcile', { method: 'POST' })
                if (res.ok) {
                  const data = await res.json()
                  await fetchClients()
                  setReconcileMessage(`Reconciled ${data.reconciled} client balances.`)
                } else {
                  const errorData = await res.json().catch(() => null)
                  console.error('Reconcile request failed', errorData)
                  setReconcileMessage('Reconciliation failed. Check console for details.')
                }
              } catch (error) {
                console.error('Reconcile error:', error)
                setReconcileMessage('Reconciliation failed. Check console for details.')
              } finally {
                setReconciling(false)
              }
            }}
            className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900"
            disabled={reconciling}
          >
            {reconciling ? 'Reconciling...' : 'Reconcile Balances'}
          </button>
        </div>
      </div>
      {reconcileMessage && (
        <div className="mb-4 rounded border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {reconcileMessage}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <h3 className="text-xl font-bold mb-4">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
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
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
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
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void fetchClients()
            }}
            className="mt-3 rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Balance</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-3">{client.firstName} {client.lastName}</td>
                  <td className="px-6 py-3">{client.email}</td>
                  <td className="px-6 py-3">{client.phone}</td>
                  <td className="px-6 py-3">₹{client.balance?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => openAccountModal(client)} className="text-blue-600 hover:underline mr-4">Account</button>
                    <button onClick={() => handleEdit(client)} className="text-blue-600 hover:underline mr-4">Edit</button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accountModalOpen && accountClient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold">{accountClient.firstName} {accountClient.lastName} - Client Account</h3>
                <p className="text-sm text-gray-600">Current net balance: ₹{(accountClient.balance ?? 0).toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {accountLoading ? (
                <div className="w-full rounded-lg border border-gray-200 p-6 text-center text-gray-600">
                  Loading account data...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Accepted Amount</p>
                      <p className="mt-2 text-lg font-semibold">₹{(accountSummary.acceptedTotal ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Payments Received</p>
                      <p className="mt-2 text-lg font-semibold">₹{(accountSummary.paymentsTotal ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Remaining Balance</p>
                      <p className="mt-2 text-lg font-semibold">₹{(accountSummary.remainingTotal ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => printAccountReport()}
                    className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900"
                  >
                    Print Account Report
                  </button>
                </>) }
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="mb-3 font-semibold">Record Payment</h4>
                <form onSubmit={handleAccountPaymentSubmit}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Against Project</label>
                    <select
                      name="projectId"
                      value={accountForm.projectId}
                      onChange={handleAccountFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Project</option>
                      {clientProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose the project so client account and project report stay in sync.
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={accountForm.amount}
                      onChange={handleAccountFormChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      name="description"
                      value={accountForm.description}
                      onChange={handleAccountFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={accountForm.date}
                      onChange={handleAccountFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                </form>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="mb-3 font-semibold">Account Summary</h4>
                <p className="text-sm text-gray-700">Balance reflects accepted quotations and recorded payments.</p>
                <p className="mt-4 text-lg font-semibold">₹{(accountClient?.balance ?? 0).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Client Transactions</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left uppercase tracking-wide text-gray-600">Date</th>
                      <th className="px-3 py-2 text-left uppercase tracking-wide text-gray-600">Type</th>
                      <th className="px-3 py-2 text-left uppercase tracking-wide text-gray-600">Description</th>
                      <th className="px-3 py-2 text-right uppercase tracking-wide text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-500">No account activity yet.</td>
                      </tr>
                    ) : (
                      accountTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-t border-gray-200">
                          <td className="px-3 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{transaction.type}</td>
                          <td className="px-3 py-2">
                            {transaction.description}
                            {transaction.project?.name ? ` (${transaction.project.name})` : ''}
                          </td>
                          <td className="px-3 py-2 text-right">₹{transaction.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
