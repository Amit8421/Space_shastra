export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-[#173b5d]">Record not found</h2>
      <p className="mt-2 text-slate-600">It may have been removed or the link may be incorrect.</p>
      <a href="/" className="mt-5 inline-flex rounded-lg bg-[#274d76] px-5 py-2.5 font-semibold text-white">Return to dashboard</a>
    </div>
  )
}
