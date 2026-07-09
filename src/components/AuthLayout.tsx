import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    let frame: number
    const step = (t: number) => {
      if (start === null) start = t
      const progress = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  const balance = useCountUp(48250)

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-parchment text-ink">
      <aside className="p-12 flex flex-col justify-between gap-6 bg-ink text-parchment">
        <div className="text-lg font-display font-semibold">Campus Wallet</div>

        <div className="space-y-4 max-w-md">
          <div className="text-3xl font-display">Your money, tracked by something smarter.</div>
          <p className="text-sm text-parchment/80">AI-powered categorization, spend insights, and fraud flags — built for university students.</p>
        </div>

        <div className="bg-ink/90 rounded-xl p-4">
          <div className="text-xs uppercase text-parchment/70">Wallet Balance</div>
          <div className="text-2xl font-display mt-2">₦{balance.toLocaleString()}</div>
          <div className="inline-block mt-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">AI reviewed 12 transactions today</div>
        </div>
      </aside>

      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="text-xs uppercase text-mint font-bold">{eyebrow}</div>
            <h2 className="text-2xl font-display mt-2">{title}</h2>
            <p className="text-sm text-gray-700 mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}