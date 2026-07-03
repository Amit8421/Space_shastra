import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#b7cade] bg-white p-8 shadow-[0_24px_70px_rgba(31,68,107,0.16)]">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#37658f]">Space Shastra Interiors</p>
          <h1 className="mt-3 text-2xl font-bold text-[#173b5d]">Secure Login</h1>
        </div>

        <Suspense fallback={<div className="text-center text-sm text-slate-500">Loading login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
