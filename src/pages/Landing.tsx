import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Wallet, Zap, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: Wallet,
    title: 'Student-first wallet',
    description: 'Send money, receive money, and top up from a single dashboard built for how students actually spend.',
  },
  {
    icon: Sparkles,
    title: 'AI transaction intelligence',
    description: 'Every transaction gets categorized automatically. Unusual spending gets flagged for a second look.',
  },
  {
    icon: BarChart3,
    title: 'Spend visibility',
    description: "See what you're spending on most, and get a warning before your balance runs out — not after.",
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    description: 'Row Level Security, atomic transfers, and signed webhooks — not bolted on, built in from the schema up.',
  },
]

const steps = [
  { title: 'Sign up', detail: 'Your wallet is created automatically — no setup screens.' },
  { title: 'Top up', detail: 'Paystack checkout, verified server-side before your balance moves.' },
  { title: 'Send', detail: 'Search a student by email, send instantly, both balances update live.' },
  { title: 'Understand', detail: 'AI categorizes spend and warns you before you run low.' },
]

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0)
  useState(() => {
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
  })
  return value
}

export default function Landing() {
  const { user, loading } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const balance = useCountUp(48250)

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#security', label: 'Security' },
  ]

  return (
    <div className="min-h-screen bg-parchment text-ink overflow-hidden">
      <header className="max-w-[1400px] mx-auto px-4 md:px-7 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ink text-parchment flex items-center justify-center font-display text-lg font-semibold shadow-card">
            C
          </div>
          <div>
            <div className="font-display text-lg leading-none">Campus Wallet</div>
            <div className="text-xs text-ink/45 mt-1">A wallet that explains itself</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink/70">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loading ? null : user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-ink text-parchment text-sm font-semibold hover:bg-ink-soft transition-colors"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:bg-mint/90 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-white text-ink"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
      </header>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-ink p-6 flex flex-col gap-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center font-display font-semibold text-ink text-sm">
                C
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-parchment/60 hover:text-parchment hover:bg-white/5"
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-parchment/75 hover:text-parchment hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-center px-4 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-center px-4 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold"
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-center px-4 py-2.5 rounded-xl border border-parchment/20 text-parchment text-sm font-semibold"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-4 md:px-7 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center pt-8 md:pt-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint-soft px-4 py-2 text-sm font-semibold text-mint">
              <Zap size={14} />
              Built for one campus, one wallet, one clear balance
            </div>

            <h1 className="font-display font-light text-4xl md:text-6xl leading-[0.98] mt-6 max-w-[13ch]">
              Know where your money went before it's gone.
            </h1>

            <p className="mt-5 max-w-2xl text-base md:text-lg text-ink/70 leading-7">
              Campus Wallet moves money between students instantly and reads every transaction as it happens —
              categorizing spend, catching anomalies, and warning you before your balance runs dry.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink text-parchment text-sm font-semibold hover:bg-ink-soft transition-colors"
              >
                {user ? 'Open dashboard' : 'Create your wallet'}
                <ArrowRight size={16} />
              </Link>
              <Link
                to={user ? '/transactions' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-white text-sm font-semibold hover:bg-parchment-dim transition-colors"
              >
                {user ? 'View transactions' : 'Log in'}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ['< 2 min', 'Signup to first send'],
                ['Live', 'Balance sync both sides'],
                ['Auto', 'Category + fraud check'],
                ['RLS', 'Every table, every row'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white p-4 shadow-card border border-white/70">
                  <div className="font-display text-lg text-ink">{label}</div>
                  <div className="mt-1 text-ink/50 text-xs leading-snug">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature element — the passbook stub, echoing the auth pages */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_20%_20%,rgba(47,174,121,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(18,23,43,0.16),transparent_35%)] blur-2xl" />

            <div className="rounded-[2rem] bg-ink p-7 md:p-8 shadow-card relative overflow-hidden max-w-md mx-auto">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-mint/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.18em] text-parchment/45 font-bold">Wallet balance</div>
                  <div className="w-9 h-9 rounded-xl bg-mint-soft/10 border border-parchment/10 flex items-center justify-center">
                    <Wallet size={16} className="text-mint" />
                  </div>
                </div>

                <div className="mt-3 font-display text-4xl md:text-5xl text-parchment">
                  ₦{balance.toLocaleString()}
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/15 px-3 py-1.5 text-sm text-mint">
                  <Sparkles size={13} />
                  AI reviewed 12 transactions today
                </div>

                <div className="mt-6 pt-6 border-t border-parchment/10 grid grid-cols-3 gap-3 text-sm">
                  {[
                    ['Food', '₦18.4k'],
                    ['Transport', '₦7.2k'],
                    ['Bills', '₦3.5k'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs uppercase tracking-[0.14em] text-parchment/40 font-bold">{label}</div>
                      <div className="mt-1.5 font-semibold text-parchment/85 text-sm">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-ink/40 mt-4">
              A live preview of what your dashboard looks like — real numbers, once you're signed up.
            </p>
          </div>
        </section>

        <section id="features" className="pt-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-mint font-bold">What it does</div>
            <h2 className="font-display font-light text-3xl md:text-4xl mt-3">
              A wallet, then a second set of eyes on it.
            </h2>
            <p className="mt-4 text-ink/70 leading-7">
              The wallet handles money reliably first. The AI layer sits on top, reading what already happened
              instead of guessing what might.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group rounded-[1.5rem] bg-white p-6 shadow-card border border-white/70 transition-transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-mint-soft text-mint flex items-center justify-center transition-colors group-hover:bg-mint group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-xl mt-5">{feature.title}</h3>
                  <p className="mt-3 text-ink/70 leading-7">{feature.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="how-it-works" className="pt-24 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-mint font-bold">How it works</div>
            <h2 className="font-display font-light text-3xl md:text-4xl mt-3">Four steps, in this order.</h2>
            <p className="mt-4 text-ink/70 leading-7">
              Each step depends on the one before it — your wallet exists before you can fund it, and the AI
              needs real transactions before it has anything to say.
            </p>
          </div>

          <ol className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-px bg-line" aria-hidden="true" />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="w-10 h-10 rounded-2xl bg-ink text-parchment flex items-center justify-center font-semibold shrink-0 z-10">
                  {index + 1}
                </div>
                <div className="rounded-[1.25rem] bg-white p-4 shadow-card border border-white/70 flex-1">
                  <div className="font-display text-lg">{step.title}</div>
                  <div className="mt-1 text-ink/65 text-sm leading-6">{step.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="security" className="pt-24 grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 items-stretch">
          <div className="rounded-[1.75rem] bg-ink text-parchment p-7 md:p-8 shadow-card overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-mint/10 blur-2xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.18em] text-parchment/45 font-bold">Security</div>
              <h2 className="font-display font-light text-3xl md:text-4xl mt-3">
                Nobody can read a wallet that isn't theirs.
              </h2>
              <p className="mt-4 text-parchment/75 leading-7">
                Row Level Security is enforced on every table — not just the ones handling money. Transfers run
                through a single atomic function, so a failed transfer can never leave one side debited without
                the other credited. Every payment webhook is signature-verified before a balance changes.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white p-7 md:p-8 shadow-card border border-white/70 flex flex-col">
            <div className="text-xs uppercase tracking-[0.18em] text-mint font-bold">Get started</div>
            <h2 className="font-display font-light text-3xl mt-3">Your wallet's ready when you are.</h2>
            <p className="mt-4 text-ink/70 leading-7">
              Sign up, and the wallet is there waiting — no setup screens, no forms to fill before you can send
              your first transfer.
            </p>
            <div className="mt-auto pt-6 flex flex-wrap gap-3">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink text-parchment text-sm font-semibold hover:bg-ink-soft transition-colors"
              >
                {user ? 'Open dashboard' : 'Sign up now'}
                <ArrowRight size={16} />
              </Link>
              <Link
                to={user ? '/transactions' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-line bg-white text-sm font-semibold hover:bg-parchment-dim transition-colors"
              >
                {user ? 'View transactions' : 'Log in'}
              </Link>
            </div>
          </div>
        </section>

        <footer className="pt-24 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink/45 border-t border-line mt-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ink text-parchment flex items-center justify-center font-display text-xs font-semibold">
              C
            </div>
            Campus Wallet
          </div>
          <div>Built for university students. Not affiliated with any bank.</div>
        </footer>
      </main>
    </div>
  )
}