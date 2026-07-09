import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function WalletPageFrame({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-parchment-dim font-body text-ink p-4 md:p-7">
      <div className="max-w-[1400px] mx-auto flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-mint font-bold mb-1">Campus Wallet</div>
              <h1 className="font-display text-2xl md:text-3xl">{title}</h1>
              {subtitle && <p className="text-sm text-ink/50 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>

          {children}
        </div>
      </div>
    </div>
  )
}
