import type { Metadata } from 'next'
import Image from 'next/image'
import LogoutButton from '@/components/LogoutButton'
import '../styles/globals.css'

const navLinkClass =
  'inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#536c8d] bg-white/10 px-4 text-sm font-medium leading-none text-[#f6f8fb] transition hover:border-[#d3b06e] hover:bg-white/16 hover:text-[#f4e5c6]'

export const metadata: Metadata = {
  title: 'Space Shastra Interiors',
  description: 'Manage clients, vendors, projects, invoices, quotations, and transactions for Space Shastra Interiors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[linear-gradient(180deg,#f6f8fc_0%,#eef2f8_100%)] text-slate-900">
        <nav className="border-b border-[#243957] bg-[linear-gradient(135deg,#0f1c2f_0%,#182844_48%,#264264_100%)] text-white shadow-[0_18px_36px_rgba(10,20,36,0.28)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:py-6 md:px-6">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="grid min-w-0 gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center lg:grid-cols-[250px_minmax(0,1fr)]">
                <div className="mx-auto flex h-[120px] w-full max-w-[220px] items-center justify-center overflow-hidden rounded-[22px] border border-[#d7b36c]/45 bg-[#1d2330] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:h-[138px] lg:h-[160px] lg:max-w-none">
                  <Image
                    src="/dashboard-logo.png"
                    alt="Space Shastra logo"
                    width={1120}
                    height={768}
                    priority
                    className="h-[116%] w-[116%] object-contain object-center"
                  />
                </div>
                <div className="min-w-0 self-center text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#c3cfdf] sm:text-[12px] sm:tracking-[0.5em]">Interior Design Studio</p>
                  <h1 className="mt-3 max-w-full break-words font-serif text-[2rem] font-bold leading-[1.05] tracking-[0.01em] text-[#f4e5c6] sm:text-[2.35rem] md:text-[2.85rem] xl:text-[3.25rem]">
                    Space Shastra Interiors
                  </h1>
                  <p className="mt-3 text-[1.05rem] font-semibold tracking-[0.05em] text-[#eef4fb] sm:text-[1.22rem] md:text-[1.5rem]">
                    Design with Style
                  </p>
                </div>
              </div>

              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <ul className="flex min-w-max items-center gap-2 text-sm font-medium sm:min-w-0 sm:flex-wrap sm:gap-3">
                  <li><a href="/" className={navLinkClass}>Dashboard</a></li>
                  <li><a href="/clients" className={navLinkClass}>Clients</a></li>
                  <li><a href="/vendors" className={navLinkClass}>Vendors</a></li>
                  <li><a href="/projects" className={navLinkClass}>Projects</a></li>
                  <li><a href="/invoices" className={navLinkClass}>Invoices</a></li>
                  <li><a href="/quotations" className={navLinkClass}>Quotations</a></li>
                  <li><a href="/transactions" className={navLinkClass}>Transactions</a></li>
                  <li className="flex"><LogoutButton /></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto w-full max-w-7xl p-4 md:p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
