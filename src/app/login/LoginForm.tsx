'use client'

import { useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'
  const [firm, setFirm] = useState('space-shastra')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm, username, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data?.error || 'Login failed.')
        return
      }

      window.location.href = nextPath.startsWith('/') ? nextPath : '/'
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="firm" className="mb-2 block text-sm font-semibold text-[#29496c]">Firm code</label>
        <input
          id="firm"
          type="text"
          value={firm}
          onChange={(event) => setFirm(event.target.value)}
          required
          autoComplete="organization"
          className="w-full rounded-lg border border-[#b7cade] px-4 py-3 outline-none transition focus:border-[#37658f] focus:ring-2 focus:ring-[#d7e9f6]"
        />
      </div>
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#29496c]">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          autoComplete="username"
          className="w-full rounded-lg border border-[#b7cade] px-4 py-3 outline-none transition focus:border-[#37658f] focus:ring-2 focus:ring-[#d7e9f6]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#29496c]">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="current-password"
          className="w-full rounded-lg border border-[#b7cade] px-4 py-3 outline-none transition focus:border-[#37658f] focus:ring-2 focus:ring-[#d7e9f6]"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#274d76] px-4 py-3 font-semibold text-white transition hover:bg-[#37658f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
