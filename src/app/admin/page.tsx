'use client'

import { FormEvent, useEffect, useState } from 'react'

type User = {
  id: string
  name: string
  username: string
  email?: string | null
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  isActive: boolean
}

type Firm = {
  id: string
  name: string
  slug: string
  schemaName: string
  status: string
  _count: { users: number }
}

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId?: string
  createdAt: string
  user?: { name: string; username: string }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [firms, setFirms] = useState<Firm[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [userForm, setUserForm] = useState({ name: '', username: '', email: '', password: '', role: 'VIEWER' as User['role'] })
  const [firmForm, setFirmForm] = useState({ name: '', slug: '', adminUsername: 'admin', adminName: 'Administrator', adminPassword: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [usersResponse, firmsResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/firms'),
        fetch('/api/admin/audit-logs'),
      ])
      if (!usersResponse.ok || !firmsResponse.ok || !logsResponse.ok) throw new Error('Unable to load administration data.')
      setUsers(await usersResponse.json())
      setFirms(await firmsResponse.json())
      setLogs((await logsResponse.json()).items)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load administration data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const createUser = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create user.')
      setUserForm({ name: '', username: '', email: '', password: '', role: 'VIEWER' })
      setMessage('User created successfully.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  const createFirm = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const payload = { ...firmForm, adminPassword: firmForm.adminPassword || undefined }
      const response = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create firm.')
      setFirmForm({ name: '', slug: '', adminUsername: 'admin', adminName: 'Administrator', adminPassword: '' })
      setMessage(`Firm created. Login firm code: ${data.firm.slug}, username: ${data.adminUser.username}, temporary password: ${data.temporaryPassword}`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create firm.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#37658f]">Administration</p>
          <h2 className="mt-2 text-3xl font-bold text-[#173b5d]">Firms, users, backups and audit history</h2>
        </div>
        <a href="/api/admin/backup" className="rounded-lg bg-[#274d76] px-5 py-3 font-semibold text-white hover:bg-[#37658f]">Download backup</a>
      </div>

      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createFirm} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#173b5d]">Add new firm</h3>
          <input aria-label="Firm name" placeholder="Firm name" required value={firmForm.name} onChange={(event) => setFirmForm({ ...firmForm, name: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Firm code" placeholder="firm-code" required pattern="[a-z0-9-]+" value={firmForm.slug} onChange={(event) => setFirmForm({ ...firmForm, slug: event.target.value.toLowerCase() })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Admin username" placeholder="Admin username" required value={firmForm.adminUsername} onChange={(event) => setFirmForm({ ...firmForm, adminUsername: event.target.value.toLowerCase() })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Admin name" placeholder="Admin name" required value={firmForm.adminName} onChange={(event) => setFirmForm({ ...firmForm, adminName: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Admin password" type="password" placeholder="Password, blank to auto-generate" minLength={10} value={firmForm.adminPassword} onChange={(event) => setFirmForm({ ...firmForm, adminPassword: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <button disabled={submitting} className="w-full rounded-lg bg-[#173b5d] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Creating…' : 'Create firm'}</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4"><h3 className="text-xl font-bold text-[#173b5d]">Registered firms</h3></div>
          {loading ? (
            <p className="p-5 text-slate-500">Loading firms…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">Firm</th><th className="px-5 py-3 text-left">Code</th><th className="px-5 py-3 text-left">Schema</th><th className="px-5 py-3 text-left">Users</th></tr></thead>
                <tbody>{firms.map((firm) => <tr key={firm.id} className="border-t"><td className="px-5 py-3 font-medium">{firm.name}</td><td className="px-5 py-3">{firm.slug}</td><td className="px-5 py-3">{firm.schemaName}</td><td className="px-5 py-3">{firm._count.users}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createUser} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#173b5d]">Add user to current firm</h3>
          <input aria-label="Name" placeholder="Full name" required minLength={2} maxLength={100} value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Username" placeholder="Username" required value={userForm.username} onChange={(event) => setUserForm({ ...userForm, username: event.target.value.toLowerCase() })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Email" type="email" placeholder="Email optional" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Password" type="password" placeholder="Temporary password" required minLength={10} value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <select aria-label="Role" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as User['role'] })} className="w-full rounded-lg border px-3 py-2.5">
            <option value="VIEWER">Viewer — read only</option>
            <option value="MANAGER">Manager — create and edit</option>
            <option value="ADMIN">Administrator — full access</option>
          </select>
          <button disabled={submitting} className="w-full rounded-lg bg-[#274d76] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Creating…' : 'Create user'}</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4"><h3 className="text-xl font-bold text-[#173b5d]">Current firm team access</h3></div>
          {loading ? (
            <p className="p-5 text-slate-500">Loading users…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Username</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Role</th></tr></thead>
                <tbody>{users.map((user) => <tr key={user.id} className="border-t"><td className="px-5 py-3 font-medium">{user.name}</td><td className="px-5 py-3">{user.username}</td><td className="px-5 py-3">{user.email || '-'}</td><td className="px-5 py-3">{user.role}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-4"><h3 className="text-xl font-bold text-[#173b5d]">Recent audit activity</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">When</th><th className="px-5 py-3 text-left">User</th><th className="px-5 py-3 text-left">Action</th><th className="px-5 py-3 text-left">Entity</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id} className="border-t"><td className="px-5 py-3">{new Date(log.createdAt).toLocaleString('en-IN')}</td><td className="px-5 py-3">{log.user?.name || 'System'}</td><td className="px-5 py-3">{log.action}</td><td className="px-5 py-3">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
