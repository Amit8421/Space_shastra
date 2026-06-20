'use client'

import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#536c8d] bg-white/10 px-4 text-sm font-medium leading-none text-[#f6f8fb] transition hover:border-[#d3b06e] hover:bg-white/16 hover:text-[#f4e5c6] disabled:opacity-70"
    >
      {loading ? 'Signing Out...' : 'Logout'}
    </button>
  )
}
