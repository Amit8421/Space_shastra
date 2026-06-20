'use client'

import { useEffect, useState } from 'react'
import { getNormalizedFieldValue } from '@/lib/text-format'

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  category?: string
  status: string
  balance?: number
}

interface Project {
  id: string
  name: string
}

interface VendorAccountFurnitureItem {
  id: string
  quotationId?: string | null
  quotationItemId?: string | null
  area: string
  category: string
  description: string
  quantity: number
  lengthCm?: number | null
  widthCm?: number | null
  areaSqFt?: number | null
  quotationRate?: number | null
  vendorRate: number
  vendorTotal: number
}

interface VendorAccount {
  id: string
  vendorId: string
  projectId: string
  openingBalance: number
  currentBalance: number
  status: string
  notes?: string
  project: Project
  furnitureItems: VendorAccountFurnitureItem[]
}

interface VendorAccountEntry {
  id: string
  vendorAccountId: string
  type: string
  amount: number
  description: string
  date: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    status: 'active'
  })
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [vendorAccounts, setVendorAccounts] = useState<VendorAccount[]>([])
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [vendorEntries, setVendorEntries] = useState<VendorAccountEntry[]>([])
  const [accountForm, setAccountForm] = useState({
    projectId: '',
    openingBalance: '0',
    notes: '',
    status: 'active',
  })
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [editingAccount, setEditingAccount] = useState(false)
  const [entryForm, setEntryForm] = useState({
    type: 'payment',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [furnitureFormItems, setFurnitureFormItems] = useState<VendorAccountFurnitureItem[]>([])
  const selectedAccount = vendorAccounts.find((account) => account.id === selectedAccountId) ?? null
  const isFurnitureVendor = selectedVendor?.category?.trim().toLowerCase() === 'furniture'
  const totalPayments = vendorEntries
    .filter((entry) => entry.type === 'payment')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
  const totalCharges = vendorEntries
    .filter((entry) => entry.type === 'charge')
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
  const totalProjectAmount = selectedAccount ? Number(selectedAccount.openingBalance) + totalCharges : 0
  const remainingAmount = selectedAccount ? Number(selectedAccount.currentBalance) : 0

  const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`

  const getFurnitureUnitValue = (item: VendorAccountFurnitureItem) => {
    const quantity = Number(item.quantity || 0)
    const storedArea = Number(item.areaSqFt || 0)
    const lengthFt = Number(item.lengthCm || 0)
    const widthFt = Number(item.widthCm || 0)
    const measuredArea = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
    const areaValue = storedArea || measuredArea

    return areaValue > 0 ? areaValue * Math.max(quantity, 1) : quantity
  }

  const formatDisplayDate = (date: string) =>
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

  useEffect(() => {
    fetchVendors()
    fetchProjects()
  }, [])

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors')
      const data = await res.json()
      setVendors(data)
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    } finally {
      setLoading(false)
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

  const fetchVendorAccounts = async (vendorId: string, projectId?: string) => {
    try {
      const query = new URLSearchParams()
      query.set('vendorId', vendorId)
      if (projectId) query.set('projectId', projectId)
      const res = await fetch(`/api/vendorAccounts?${query.toString()}`)
      const data = await res.json()
      const accounts = Array.isArray(data) ? data : []
      if (!Array.isArray(data)) {
        console.warn('Expected vendorAccounts array, got:', data)
      }
      setVendorAccounts(accounts)
      if (accounts.length > 0) {
        setSelectedAccountId((currentAccountId) => {
          if (currentAccountId && accounts.some((account) => account.id === currentAccountId)) {
            return currentAccountId
          }
          return accounts[0].id
        })
      } else {
        setSelectedAccountId('')
        setVendorEntries([])
      }
    } catch (error) {
      console.error('Failed to fetch vendor accounts:', error)
    }
  }

  const fetchVendorEntries = async (vendorAccountId: string) => {
    if (!vendorAccountId) {
      setVendorEntries([])
      return
    }

    try {
      const res = await fetch(`/api/vendorAccountEntries?vendorAccountId=${vendorAccountId}`)
      const data = await res.json()
      setVendorEntries(data)
    } catch (error) {
      console.error('Failed to fetch vendor entries:', error)
    }
  }

  useEffect(() => {
    if (selectedAccountId) {
      fetchVendorEntries(selectedAccountId)
    }
  }, [selectedAccountId])

  useEffect(() => {
    setFurnitureFormItems(selectedAccount?.furnitureItems || [])
  }, [selectedAccount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors'
      const method = editingVendor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingVendor(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: '',
          status: 'active'
        })
        fetchVendors() // Refresh the list
      } else {
        console.error('Failed to save vendor')
      }
    } catch (error) {
      console.error('Error saving vendor:', error)
    }
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      category: vendor.category || '',
      status: vendor.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        const res = await fetch(`/api/vendors/${id}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          fetchVendors() // Refresh the list
        } else {
          console.error('Failed to delete vendor')
        }
      } catch (error) {
        console.error('Error deleting vendor:', error)
      }
    }
  }

  const openVendorAccountModal = async (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setProjectFilter('')
    setVendorAccounts([])
    setVendorEntries([])
    setSelectedAccountId('')
    setAccountForm({
      projectId: '',
      openingBalance: '0',
      notes: '',
      status: 'active',
    })
    setEntryForm({
      type: 'payment',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    setAccountError('')
    setAccountSuccess('')
    setEditingAccount(false)
    setShowAccountModal(true)
    await fetchVendorAccounts(vendor.id)
  }

  const handleAccountFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAccountForm({
      ...accountForm,
      [e.target.name]: getNormalizedFieldValue(e.target),
    })
  }

  const handleEntryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEntryForm({
      ...entryForm,
      [e.target.name]: getNormalizedFieldValue(e.target),
    })
  }

  const handleFurnitureRateChange = (itemId: string, nextRate: string) => {
    const parsedRate = Number(nextRate) || 0

    setFurnitureFormItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          vendorRate: parsedRate,
          vendorTotal: Number((getFurnitureUnitValue(item) * parsedRate).toFixed(2)),
        }
      }),
    )
  }

  const handleCreateVendorAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVendor) return
    if (!accountForm.projectId) {
      console.error('Please select a project before creating an account.')
      return
    }

    try {
      const res = await fetch('/api/vendorAccounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          projectId: accountForm.projectId,
          openingBalance: Number(accountForm.openingBalance) || 0,
          notes: accountForm.notes,
          status: accountForm.status,
        }),
      })

      if (res.ok) {
        const createdAccount = await res.json()
        setProjectFilter(accountForm.projectId)
        await fetchVendorAccounts(selectedVendor.id, accountForm.projectId)
        setAccountForm({ projectId: '', openingBalance: '0', notes: '', status: 'active' })
        setSelectedAccountId(createdAccount.id)
        setAccountError('')
        setAccountSuccess('Vendor project account created successfully.')
      } else {
        let message = `Failed to create vendor account (status ${res.status})`
        try {
          const errorBody = await res.json()
          if (errorBody?.error) {
            message = errorBody.error
          }
        } catch (jsonError) {
          const text = await res.text().catch(() => '')
          if (text) message = text
        }
        setAccountError(message)
        console.error('Failed to create vendor account', message)
      }
    } catch (error) {
      console.error('Error creating vendor account:', error)
    }
  }

  const handleCreateVendorEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountId) return

    try {
      const res = await fetch('/api/vendorAccountEntries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorAccountId: selectedAccountId,
          type: entryForm.type,
          amount: Number(entryForm.amount) || 0,
          description: entryForm.description,
          date: entryForm.date,
        }),
      })

      if (res.ok) {
        fetchVendorEntries(selectedAccountId)
        if (selectedVendor) {
          fetchVendorAccounts(selectedVendor.id, projectFilter)
          fetchVendors()
        }
        setEntryForm({ type: 'payment', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
      } else {
        console.error('Failed to create vendor account entry')
      }
    } catch (error) {
      console.error('Error creating vendor entry:', error)
    }
  }

  const startEditAccount = () => {
    if (!selectedAccount) return

    setAccountForm({
      projectId: selectedAccount.projectId,
      openingBalance: selectedAccount.openingBalance.toString(),
      notes: selectedAccount.notes || '',
      status: selectedAccount.status,
    })
    setFurnitureFormItems(selectedAccount.furnitureItems || [])
    setAccountError('')
    setAccountSuccess('')
    setEditingAccount(true)
  }

  const handleUpdateVendorAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVendor || !selectedAccount) return

    try {
      const res = await fetch(`/api/vendorAccounts/${selectedAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openingBalance: Number(accountForm.openingBalance) || 0,
          notes: accountForm.notes,
          status: accountForm.status,
          furnitureItems: furnitureFormItems.map((item) => ({
            id: item.id,
            vendorRate: Number(item.vendorRate) || 0,
          })),
        }),
      })

      if (res.ok) {
        const updatedAccount = await res.json()
        await fetchVendorAccounts(selectedVendor.id, projectFilter)
        setSelectedAccountId(updatedAccount.id)
        fetchVendors()
        setEditingAccount(false)
        setAccountError('')
        setAccountSuccess('Vendor project account updated successfully.')
      } else {
        let message = `Failed to update vendor account (status ${res.status})`
        try {
          const errorBody = await res.json()
          if (errorBody?.error) {
            message = errorBody.error
          }
        } catch (jsonError) {
          const text = await res.text().catch(() => '')
          if (text) message = text
        }
        setAccountSuccess('')
        setAccountError(message)
      }
    } catch (error) {
      console.error('Error updating vendor account:', error)
      setAccountSuccess('')
      setAccountError('Failed to update vendor account.')
    }
  }

  const handleProjectFilterChange = async (projectId: string) => {
    if (!selectedVendor) return
    setProjectFilter(projectId)
    await fetchVendorAccounts(selectedVendor.id, projectId)
  }

  const handleSelectedAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId)
    setEditingAccount(false)
    setAccountError('')
    setAccountSuccess('')
  }

  const handlePrintReport = () => {
    if (!selectedVendor || !selectedAccount) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    const logoUrl = `${window.location.origin}/dashboard-logo.png`
    const printDate = formatDisplayDate(new Date().toISOString())
    const furnitureRows = selectedAccount.furnitureItems.length > 0
      ? selectedAccount.furnitureItems
          .map((item, index) => `
            <tr>
              <td class="col-index">${index + 1}</td>
              <td class="col-area">${escapeHtml(item.area || '-')}</td>
              <td class="col-description">${escapeHtml(item.description)}</td>
              <td class="col-size">${Number(item.lengthCm || 0) > 0 ? Number(item.lengthCm).toFixed(2) : '-'}</td>
              <td class="col-size">${Number(item.widthCm || 0) > 0 ? Number(item.widthCm).toFixed(2) : '-'}</td>
              <td class="col-unit amount">${getFurnitureUnitValue(item).toFixed(2)}</td>
              <td class="col-rate amount">${formatCurrency(Number(item.vendorRate || 0))}</td>
              <td class="col-total amount">${formatCurrency(Number(item.vendorTotal || 0))}</td>
            </tr>
          `)
          .join('')
      : ''

    const entryRows = vendorEntries.length > 0
      ? vendorEntries
          .map((entry, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(entry.type)}</td>
              <td>${formatDisplayDate(entry.date)}</td>
              <td>${escapeHtml(entry.description || '-')}</td>
              <td class="amount">${formatCurrency(Number(entry.amount))}</td>
            </tr>
          `)
          .join('')
      : `
        <tr>
          <td colspan="5" class="empty">No entries recorded yet.</td>
        </tr>
      `

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Vendor Project Report</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #111827;
              background: #ffffff;
            }
            .page {
              width: 100%;
              max-width: 100%;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 18px;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .brand {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              flex: 1;
              min-width: 0;
            }
            .brand-logo {
              width: 88px;
              border-radius: 14px;
              overflow: hidden;
              background: #1d2330;
              flex-shrink: 0;
            }
            .brand-logo img {
              display: block;
              width: 100%;
              height: auto;
            }
            .brand-copy {
              min-width: 0;
              flex: 1;
            }
            .brand-name {
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #c87926;
              line-height: 1.25;
              margin-bottom: 4px;
            }
            h1, h2, h3, p {
              margin: 0;
            }
            h1 {
              font-size: 30px;
              line-height: 1.05;
              margin-bottom: 6px;
            }
            h3.section-title {
              margin: 18px 0 8px;
              font-size: 18px;
              line-height: 1.1;
            }
            .meta {
              margin-top: 4px;
              color: #4b5563;
              font-size: 13px;
              line-height: 1.35;
            }
            .print-meta {
              flex-shrink: 0;
              min-width: 150px;
              text-align: right;
              font-size: 13px;
              line-height: 1.35;
              color: #334155;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 18px;
            }
            .card {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .label {
              font-size: 11px;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .value {
              font-size: 18px;
              font-weight: 700;
            }
            .table-section {
              margin-top: 10px;
              page-break-inside: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 10px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
              line-height: 1.25;
              word-break: break-word;
            }
            th {
              background: #eef2ff;
              font-size: 11px;
              font-weight: 700;
              white-space: normal;
            }
            thead {
              display: table-header-group;
            }
            .amount {
              text-align: right;
              white-space: nowrap;
            }
            .col-index {
              width: 5%;
              text-align: center;
            }
            .col-area {
              width: 14%;
            }
            .col-description {
              width: 28%;
            }
            .col-size {
              width: 9%;
              text-align: center;
            }
            .col-unit {
              width: 11%;
            }
            .col-rate {
              width: 14%;
            }
            .col-total {
              width: 16%;
            }
            .empty {
              text-align: center;
              color: #6b7280;
            }
            .footer {
              margin-top: 10px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body {
                margin: 0;
              }
              .page {
                padding: 0;
              }
              .table-section {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
          <div class="header">
            <div class="brand">
              <div class="brand-logo"><img src="${logoUrl}" alt="Space Shastra logo" /></div>
              <div class="brand-copy">
                <div class="brand-name">Space Shastra Interiors</div>
                <h1>Vendor Project Report</h1>
                <p class="meta">Vendor: ${escapeHtml(selectedVendor.name)}</p>
                <p class="meta">Project: ${escapeHtml(selectedAccount.project.name)}</p>
                <p class="meta">Status: ${escapeHtml(selectedAccount.status)}</p>
              </div>
            </div>
            <div class="print-meta">
              <p><strong>Printed On:</strong> ${printDate}</p>
            </div>
          </div>

          <div class="summary">
            <div class="card">
              <div class="label">Total Amount</div>
              <div class="value">${formatCurrency(Number(selectedAccount.openingBalance))}</div>
            </div>
            <div class="card">
              <div class="label">Payments Made</div>
              <div class="value">${formatCurrency(totalPayments)}</div>
            </div>
            <div class="card">
              <div class="label">Extra Charges</div>
              <div class="value">${formatCurrency(totalCharges)}</div>
            </div>
            <div class="card">
              <div class="label">Remaining</div>
              <div class="value">${formatCurrency(remainingAmount)}</div>
            </div>
          </div>

          ${selectedAccount.furnitureItems.length > 0 ? `
            <div class="table-section">
            <h3 class="section-title">Synced Furniture Items</h3>
            <table>
              <thead>
                <tr>
                  <th class="col-index">#</th>
                  <th class="col-area">Area</th>
                  <th class="col-description">Description</th>
                  <th class="col-size">Length (ft)</th>
                  <th class="col-size">Width (ft)</th>
                  <th class="col-unit amount">Billable Unit</th>
                  <th class="col-rate amount">Carpenter Rate</th>
                  <th class="col-total amount">Total</th>
                </tr>
              </thead>
              <tbody>
                ${furnitureRows}
              </tbody>
            </table>
            </div>
          ` : ''}

          <div class="table-section">
          <h3 class="section-title">Entry Details</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${entryRows}
            </tbody>
          </table>
          </div>

          <p class="footer">Net project value after extra charges: ${formatCurrency(totalProjectAmount)}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(reportHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: getNormalizedFieldValue(e.target)
    })
  }

  const openAddModal = () => {
    setEditingVendor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      category: '',
      status: 'active'
    })
    setShowModal(true)
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Vendors</h2>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Vendor
        </button>
      </div>

      {/* Add/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
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
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="furniture">Furniture</option>
                  <option value="paint">Paint</option>
                  <option value="flooring">Flooring</option>
                  <option value="lighting">Lighting</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="other">Other</option>
                </select>
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
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-auto py-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Vendor Accounts</h3>
                <p className="text-sm text-gray-600">{selectedVendor.name}</p>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Filter</label>
                  <select
                    value={projectFilter}
                    onChange={(e) => handleProjectFilterChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => handleSelectedAccountChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Account</option>
                    {vendorAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.project.name} — {account.status}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAccount && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-indigo-950">Vendor Project Report</h4>
                        <p className="text-sm text-indigo-700">{selectedVendor.name} - {selectedAccount.project.name}</p>
                        {isFurnitureVendor && (
                          <p className="mt-1 text-xs text-indigo-700">
                            Furniture totals are synced from the latest accepted quotation for this project.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handlePrintReport}
                          className="text-sm font-medium text-indigo-700 hover:underline"
                        >
                          Print Report
                        </button>
                        <button
                          type="button"
                          onClick={startEditAccount}
                          className="text-sm font-medium text-indigo-700 hover:underline"
                        >
                          {isFurnitureVendor ? 'Edit Rates' : 'Edit Total'}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">₹{selectedAccount.openingBalance.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Payments Made</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">₹{totalPayments.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Extra Charges</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">₹{totalCharges.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Remaining</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">₹{remainingAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-indigo-800">
                      Net project value after extra charges: ₹{totalProjectAmount.toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Accounts</h4>
                    {selectedAccount && (
                      <button
                        type="button"
                        onClick={startEditAccount}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Edit Account
                      </button>
                    )}
                  </div>
                  {vendorAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600">No accounts available for this vendor.</p>
                  ) : (
                    <div className="space-y-3">
                      {vendorAccounts.map((account) => (
                        <div key={account.id} className="rounded-lg border p-3">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{account.project.name}</p>
                            <span className="text-xs text-gray-500">{account.status}</span>
                          </div>
                          <p className="text-sm text-gray-600">Total Amount: ₹{account.openingBalance.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Balance: ₹{account.currentBalance.toFixed(2)}</p>
                          {isFurnitureVendor && account.furnitureItems.length > 0 && (
                            <p className="text-sm text-gray-600">Synced items: {account.furnitureItems.length}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {selectedAccount && isFurnitureVendor && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-amber-950">Synced Furniture Items</h4>
                        <p className="text-xs text-amber-800">
                          Sizes and quantities come from the latest accepted quotation. Only carpenter rate is editable here.
                        </p>
                      </div>
                      {!editingAccount && (
                        <button
                          type="button"
                          onClick={startEditAccount}
                          className="text-sm font-medium text-amber-900 hover:underline"
                        >
                          Edit Carpenter Rates
                        </button>
                      )}
                    </div>
                    {selectedAccount.furnitureItems.length === 0 ? (
                      <p className="text-sm text-amber-900">
                        No furniture items are available to sync yet. Accept a quotation with furniture rows for this project.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
                        <table className="min-w-full text-sm">
                          <thead className="bg-amber-100 text-left text-amber-950">
                            <tr>
                              <th className="px-3 py-2 font-medium">Area</th>
                              <th className="px-3 py-2 font-medium">Description</th>
                              <th className="px-3 py-2 font-medium">Length (ft)</th>
                              <th className="px-3 py-2 font-medium">Width (ft)</th>
                              <th className="px-3 py-2 font-medium">Billable Unit</th>
                              <th className="px-3 py-2 font-medium">Quotation Rate</th>
                              <th className="px-3 py-2 font-medium">Carpenter Rate</th>
                              <th className="px-3 py-2 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {furnitureFormItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2">{item.area}</td>
                                <td className="px-3 py-2">{item.description}</td>
                                <td className="px-3 py-2">{Number(item.lengthCm || 0) > 0 ? Number(item.lengthCm).toFixed(2) : '-'}</td>
                                <td className="px-3 py-2">{Number(item.widthCm || 0) > 0 ? Number(item.widthCm).toFixed(2) : '-'}</td>
                                <td className="px-3 py-2">{getFurnitureUnitValue(item).toFixed(2)}</td>
                                <td className="px-3 py-2">₹{Number(item.quotationRate || 0).toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.vendorRate}
                                    disabled={!editingAccount}
                                    onChange={(e) => handleFurnitureRateChange(item.id, e.target.value)}
                                    className="w-28 rounded-md border border-amber-200 px-2 py-1 disabled:bg-gray-100"
                                  />
                                </td>
                                <td className="px-3 py-2 font-medium">₹{Number(item.vendorTotal || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{editingAccount ? 'Edit Vendor Project Account' : 'Create New Vendor Account'}</h4>
                    {editingAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccount(false)
                          setAccountError('')
                          setAccountSuccess('')
                          setFurnitureFormItems(selectedAccount?.furnitureItems || [])
                          setAccountForm({ projectId: '', openingBalance: '0', notes: '', status: 'active' })
                        }}
                        className="text-sm font-medium text-gray-600 hover:underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <form onSubmit={editingAccount ? handleUpdateVendorAccount : handleCreateVendorAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project</label>
                      <select
                        name="projectId"
                        value={accountForm.projectId}
                        onChange={handleAccountFormChange}
                        required
                        disabled={editingAccount}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select Project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                      <input
                        type="number"
                        name="openingBalance"
                        value={accountForm.openingBalance}
                        onChange={handleAccountFormChange}
                        disabled={isFurnitureVendor}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {isFurnitureVendor && (
                        <p className="mt-1 text-xs text-gray-500">
                          For furniture vendors this amount is calculated automatically from synced quotation items.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        value={accountForm.notes}
                        onChange={handleAccountFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={accountForm.status}
                        onChange={handleAccountFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <button
                      type={editingAccount ? 'submit' : 'button'}
                      onClick={editingAccount ? undefined : handleCreateVendorAccount}
                      className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                    >
                      {editingAccount ? 'Update Account' : 'Create Account'}
                    </button>
                    {accountSuccess && (
                      <p className="text-sm text-green-600 mt-2">{accountSuccess}</p>
                    )}
                    {accountError && (
                      <p className="text-sm text-red-600 mt-2">{accountError}</p>
                    )}
                  </form>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold mb-3">Vendor Account Entries</h4>
                  <form onSubmit={handleCreateVendorEntry} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Against Project</label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => handleSelectedAccountChange(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select Project Account</option>
                        {vendorAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.project.name} - {account.status}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose the project against which this vendor payment or charge should be recorded.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        name="type"
                        value={entryForm.type}
                        onChange={handleEntryFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="payment">Payment</option>
                        <option value="charge">Charge</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        name="amount"
                        value={entryForm.amount}
                        onChange={handleEntryFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={entryForm.description}
                        onChange={handleEntryFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={entryForm.date}
                        onChange={handleEntryFormChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!selectedAccountId}
                      className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Record Entry
                    </button>
                    {selectedAccount && (
                      <p className="text-sm text-gray-600">
                        Recording against: <span className="font-medium">{selectedAccount.project.name}</span>
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold mb-3">Entries</h4>
              {vendorEntries.length === 0 ? (
                <p className="text-sm text-gray-600">No entries recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {vendorEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{entry.type}</p>
                        <span className="text-sm text-gray-500">{entry.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">Amount: ₹{entry.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{entry.description}</p>
                    </div>
                  ))}
                </div>
              )}
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-6 py-3">{vendor.name}</td>
                  <td className="px-6 py-3">{vendor.email}</td>
                  <td className="px-6 py-3">{vendor.phone}</td>
                  <td className="px-6 py-3">{vendor.category}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => openVendorAccountModal(vendor)}
                      className="text-indigo-600 hover:underline mr-4"
                    >
                      Account
                    </button>
                    <button 
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(vendor.id)}
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
