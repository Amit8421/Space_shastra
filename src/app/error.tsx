'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error])

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-xl font-bold text-red-900">We could not load this page</h2>
      <p className="mt-2 text-sm text-red-700">Please retry. If the problem continues, share reference {error.digest || 'not available'} with an administrator.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-lg bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800">
        Try again
      </button>
    </div>
  )
}
