'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue } from '@/lib/text-format'

interface Purchase {
  id: string
  purchaseNo: string
  amount: number
  status: string
  vendor: {
    name: string
  }
  project: {
    name: string
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

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [formData, setFormData] = useState({
    purchaseNo: '',
    vendorId: '',
    projectId: '',
    items: '',
    amount: '',
    status: 'pending',
    notes: ''
  })

  useEffect(() => {
    fetchPurchases()
    fetchVendors()
    fetchProjects()
  }, [])

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases')
      const data = await res.json()
      setPurchases(data)
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPurchase ? `/api/purchases/${editingPurchase.id}` : '/api/purchases'
      const method = editingPurchase ? 'PUT' : 'POST'

      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        purchaseNo: formData.purchaseNo || `PO-${Date.now()}`
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
        setEditingPurchase(null)
        setFormData({
          purchaseNo: '',
          vendorId: '',
          projectId: '',
          items: '',
          amount: '',
          status: 'pending',
          notes: ''
        })
        fetchPurchases() // Refresh the list
      } else {
        console.error('Failed to save purchase')
      }
    } catch (error) {
      console.error('Error saving purchase:', error)
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    setFormData({
      purchaseNo: purchase.purchaseNo,
      vendorId: '', // Would need to get from purchase data
      projectId: '', // Would need to get from purchase data
      items: '', // Would need to get from purchase data
      amount: purchase.amount.toString(),
      status: purchase.status,
      notes: '' // Would need to get from purchase data
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const res = await fetch(`/api/purchases/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchPurchases() // Refresh the list
        } else {
          console.error('Failed to delete purchase')
        }
      } catch (error) {
        console.error('Error deleting purchase:', error)
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
    setEditingPurchase(null)
    setFormData({
      purchaseNo: '',
      vendorId: '',
      projectId: '',
      items: '',
      amount: '',
      status: 'pending',
      notes: ''
    })
    setShowModal(true)
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Purchases</h2>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Purchase Order
        </button>
      </div>

      {/* Add/Edit Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingPurchase ? 'Edit Purchase Order' : 'Create New Purchase Order'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Purchase Order Number</label>
                <input
                  type="text"
                  name="purchaseNo"
                  value={formData.purchaseNo}
                  onChange={handleInputChange}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleInputChange}
                  required
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
                <label className="block text-sm font-medium mb-1">Items Description</label>
                <textarea
                  name="items"
                  value={formData.items}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the items being purchased"
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
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
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
                  {editingPurchase ? 'Update Purchase' : 'Create Purchase Order'}
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">PO #</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Vendor</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-3 font-semibold">{purchase.purchaseNo}</td>
                  <td className="px-6 py-3">{purchase.vendor.name}</td>
                  <td className="px-6 py-3">{purchase.project.name}</td>
                  <td className="px-6 py-3">${purchase.amount.toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      purchase.status === 'received' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button 
                      onClick={() => handleEdit(purchase)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(purchase.id)}
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
