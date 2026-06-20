'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue } from '@/lib/text-format'

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  date: string
  vendor?: {
    id: string
    name: string
  }
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

interface Vendor {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface VendorAccount {
  id: string
  projectId: string
  project: Project
  status: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vendorAccounts, setVendorAccounts] = useState<VendorAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    type: 'expense',
    vendorId: '',
    projectId: '',
    clientId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const isVendorPayment = formData.type === 'payment' && Boolean(formData.vendorId)

  useEffect(() => {
    fetchTransactions()
    fetchVendors()
    fetchProjects()
    fetchClients()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors')
      const data = await res.json()
      setVendors(data)
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
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

  const fetchVendorAccounts = async (vendorId: string) => {
    if (!vendorId) {
      setVendorAccounts([])
      return
    }

    try {
      const res = await fetch(`/api/vendorAccounts?vendorId=${vendorId}`)
      const data = await res.json()
      setVendorAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch vendor accounts:', error)
      setVendorAccounts([])
    }
  }

  useEffect(() => {
    if (!formData.vendorId) {
      setVendorAccounts([])
      return
    }

    fetchVendorAccounts(formData.vendorId)
  }, [formData.vendorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isVendorPayment && !formData.projectId) {
      console.error('Project account is required for vendor payments')
      return
    }

    try {
      const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        vendorId: formData.vendorId || undefined,
        projectId: formData.projectId || undefined,
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingTransaction(null)
        setFormData({
          type: 'expense',
          vendorId: '',
          projectId: '',
          clientId: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        setVendorAccounts([])
        fetchTransactions() // Refresh the list
      } else {
        console.error('Failed to save transaction')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      vendorId: transaction.vendor?.id || '',
      projectId: transaction.project?.id || '',
      clientId: transaction.client?.id || '',
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchTransactions() // Refresh the list
        } else {
          console.error('Failed to delete transaction')
        }
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    const value = getNormalizedFieldValue(e.target)

    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'type' && value !== 'credit payment' ? { clientId: '' } : {}),
      ...(name === 'vendorId' ? { projectId: '' } : {}),
    })
  }

  const openAddModal = () => {
    setEditingTransaction(null)
    setFormData({
      type: 'expense',
      vendorId: '',
      projectId: '',
      clientId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    })
    setVendorAccounts([])
    setShowModal(true)
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Transactions</h2>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Transaction
        </button>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="purchase">Purchase</option>
                  <option value="payment">Payment</option>
                  <option value="credit payment">Credit Payment</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vendor (Optional)</label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              {isVendorPayment ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Vendor Project Account</label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project Account</option>
                    {vendorAccounts.map((account) => (
                      <option key={account.id} value={account.projectId}>
                        {account.project.name} ({account.status})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Vendor payments must be linked to a project account so project cost and profit/loss stay accurate.
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Project (Optional)</label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isVendorPayment && vendorAccounts.length === 0 && (
                <p className="mb-4 text-sm text-red-600">
                  No project account exists for this vendor yet. Create one from the Vendors page before recording payment.
                </p>
              )}
              {formData.type === 'credit payment' && (
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
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </form>
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Party</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-3">{transaction.description}</td>
                  <td className="px-6 py-3">${transaction.amount.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    {transaction.vendor?.name || (transaction.client ? `${transaction.client.firstName} ${transaction.client.lastName}` : '-')}
                  </td>
                  <td className="px-6 py-3">{transaction.project?.name || '-'}</td>
                  <td className="px-6 py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <button 
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction.id)}
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
