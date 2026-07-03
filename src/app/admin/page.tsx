'use client'

import { FormEvent, useEffect, useState } from 'react'

type User = { id: string; name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'VIEWER'; isActive: boolean }
type AuditLog = { id: string; action: string; entityType: string; entityId?: string; createdAt: string; user?: { name: string; email: string } }

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' as User['role'] })

  const load = async () => {
    setLoading(true)
    try {
      const [usersResponse, logsResponse] = await Promise.all([fetch('/api/admin/users'), fetch('/api/admin/audit-logs')])
      if (!usersResponse.ok || !logsResponse.ok) throw new Error('Unable to load administration data.')
      setUsers(await usersResponse.json())
      setLogs((await logsResponse.json()).items)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load administration data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const createUser = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create user.')
      setForm({ name: '', email: '', password: '', role: 'VIEWER' })
      setMessage('User created successfully.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#37658f]">Administration</p><h2 className="mt-2 text-3xl font-bold text-[#173b5d]">Users, backups and audit history</h2></div>
        <a href="/api/admin/backup" className="rounded-lg bg-[#274d76] px-5 py-3 font-semibold text-white hover:bg-[#37658f]">Download backup</a>
      </div>
      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}
      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createUser} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#173b5d]">Add user</h3>
          <input aria-label="Name" placeholder="Full name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Email" type="email" placeholder="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <input aria-label="Password" type="password" placeholder="Temporary password" required minLength={10} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" />
          <select aria-label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User['role'] })} className="w-full rounded-lg border px-3 py-2.5">
            <option value="VIEWER">Viewer — read only</option><option value="MANAGER">Manager — create and edit</option><option value="ADMIN">Administrator — full access</option>
          </select>
          <button disabled={submitting} className="w-full rounded-lg bg-[#274d76] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Creating…' : 'Create user'}</button>
        </form>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4"><h3 className="text-xl font-bold text-[#173b5d]">Team access</h3></div>
          {loading ? <p className="p-5 text-slate-500">Loading users…</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Role</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t"><td className="px-5 py-3 font-medium">{user.name}</td><td className="px-5 py-3">{user.email}</td><td className="px-5 py-3">{user.role}</td></tr>)}</tbody></table></div>}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-4"><h3 className="text-xl font-bold text-[#173b5d]">Recent audit activity</h3></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left">When</th><th className="px-5 py-3 text-left">User</th><th className="px-5 py-3 text-left">Action</th><th className="px-5 py-3 text-left">Entity</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t"><td className="px-5 py-3">{new Date(log.createdAt).toLocaleString('en-IN')}</td><td className="px-5 py-3">{log.user?.name || 'System'}</td><td className="px-5 py-3">{log.action}</td><td className="px-5 py-3">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}
