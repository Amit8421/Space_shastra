'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue, normalizeCapitalizedText } from '@/lib/text-format'

interface InvoiceItem {
  id?: string
  description: string
  quantity: string
  unitPrice: string
  total: number
}

interface Invoice {
  id: string
  invoiceNo: string
  amount: number
  status: string
  issueDate: string
  clientId: string
  projectId: string
  notes?: string
  client: {
    firstName: string
    lastName: string
  }
  project?: {
    name: string
  }
  items: InvoiceItem[]
}

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface Project {
  id: string
  name: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    invoiceNo: '',
    clientId: '',
    projectId: '',
    amount: '',
    notes: '',
    status: 'pending'
  })
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: '', quantity: '1', unitPrice: '0', total: 0 }
  ])

  useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchProjects()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
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

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) => {
    const updatedItems = invoiceItems.map((item, idx) => {
      if (idx !== index) return item
      const normalizedValue = field === 'description' ? normalizeCapitalizedText(value) : value
      const updatedItem = {
        ...item,
        [field]: normalizedValue,
      }
      const quantity = parseFloat(updatedItem.quantity) || 0
      const unitPrice = parseFloat(updatedItem.unitPrice) || 0
      return {
        ...updatedItem,
        total: quantity * unitPrice,
      }
    })
    setInvoiceItems(updatedItems)
    setFormData({
      ...formData,
      amount: calculateTotal(updatedItems).toString(),
    })
  }

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: '1', unitPrice: '0', total: 0 }])
  }

  const removeItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, idx) => idx !== index)
    setInvoiceItems(updatedItems.length ? updatedItems : [{ description: '', quantity: '1', unitPrice: '0', total: 0 }])
    setFormData({
      ...formData,
      amount: calculateTotal(updatedItems).toString(),
    })
  }

  const openViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices'
      const method = editingInvoice ? 'PUT' : 'POST'

      const itemData = invoiceItems.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0,
      }))
      const amount = calculateTotal(invoiceItems)

      const submitData = {
        ...formData,
        amount,
        notes: formData.notes,
        invoiceNo: formData.invoiceNo || `INV-${Date.now()}`,
        items: itemData,
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
        setEditingInvoice(null)
        setFormData({
          invoiceNo: '',
          clientId: '',
          projectId: '',
          amount: '',
          notes: '',
          status: 'pending'
        })
        setInvoiceItems([{ description: '', quantity: '1', unitPrice: '0', total: 0 }])
        fetchInvoices() // Refresh the list
      } else {
        console.error('Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      invoiceNo: invoice.invoiceNo,
      clientId: invoice.clientId,
      projectId: invoice.projectId,
      amount: invoice.amount.toString(),
      notes: invoice.notes || '',
      status: invoice.status
    })
    setInvoiceItems(invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      total: item.total,
    })))
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchInvoices() // Refresh the list
        } else {
          console.error('Failed to delete invoice')
        }
      } catch (error) {
        console.error('Error deleting invoice:', error)
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
    setEditingInvoice(null)
    setFormData({
      invoiceNo: '',
      clientId: '',
      projectId: '',
      amount: '',
      notes: '',
      status: 'pending'
    })
    setShowModal(true)
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Invoices</h2>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Invoice
        </button>
      </div>

      {/* Add/Edit Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  placeholder="Auto-generated if empty"
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
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  required
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
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Invoice Items</label>
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-xs font-medium mb-1">Qty</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-xs font-medium mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-xs font-medium mb-1">Total</label>
                        <input
                          type="text"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 inline-flex items-center px-3 py-2 bg-black text-white rounded hover:bg-gray-900"
                >
                  + Add Item
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <input
                  type="text"
                  name="amount"
                  value={calculateTotal(invoiceItems).toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
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
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
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
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Space Shastra Interiors</p>
                <h2 className="text-2xl font-bold">Quotation Report</h2>
                <p className="text-sm text-gray-600">Invoice #{viewingInvoice.invoiceNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
              <div>
                <p className="font-semibold">Client</p>
                <p>{viewingInvoice.client.firstName} {viewingInvoice.client.lastName}</p>
              </div>
              <div>
                <p className="font-semibold">Project</p>
                <p>{viewingInvoice.project?.name || '-'}</p>
              </div>
              <div>
                <p className="font-semibold">Date</p>
                <p>{new Date(viewingInvoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p className="uppercase text-sm tracking-[0.2em] text-black">{viewingInvoice.status}</p>
              </div>
            </div>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border border-gray-200">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Description</th>
                    <th className="px-4 py-3 text-right text-sm">Qty</th>
                    <th className="px-4 py-3 text-right text-sm">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item) => (
                    <tr key={item.id || item.description} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm">{item.description}</td>
                      <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm">${parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4 text-sm">
              <div className="text-right">
                <p className="font-semibold">Notes</p>
                <p className="text-gray-600">{viewingInvoice.notes || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Grand Total</p>
                <p className="text-xl font-bold">${viewingInvoice.amount.toFixed(2)}</p>
              </div>
            </div>
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Invoice #</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-3 font-semibold">{invoice.invoiceNo}</td>
                  <td className="px-6 py-3">{invoice.client.firstName} {invoice.client.lastName}</td>
                  <td className="px-6 py-3">${invoice.amount.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <button 
                      onClick={() => openViewInvoice(invoice)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id)}
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
