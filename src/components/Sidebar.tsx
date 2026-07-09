import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Send, PlusCircle, Settings, Menu, X, LogOut } from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/send', icon: Send, label: 'Send' },
  { to: '/topup', icon: PlusCircle, label: 'Top up' },
]

export function Sidebar({
  onTopUp,
  onSend,
  onLogout,
}: {
  onTopUp?: () => void
  onSend?: () => void
  onLogout?: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar — unchanged */}
      <aside className="hidden md:flex flex-col items-center justify-between w-20 py-6 bg-ink rounded-xl2 h-[calc(100vh-56px)] sticky top-7">
        <div className="flex flex-col items-center gap-8">
          <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center font-display font-semibold text-ink text-lg">
            C
          </div>

          <nav className="flex flex-col gap-2">
            {links.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-mint text-ink' : 'text-parchment/50 hover:text-parchment hover:bg-white/5'
                  }`
                }
                title={label}
              >
                <Icon size={19} strokeWidth={2} />
              </NavLink>
            ))}
          </nav>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${
              isActive ? 'bg-mint text-ink' : 'text-parchment/40 hover:text-parchment hover:bg-white/5'
            }`
          }
          title="Settings"
        >
          <Settings size={19} strokeWidth={2} />
        </NavLink>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between mb-4 pb-4 border-b border-line">
        <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center font-display font-semibold text-ink text-sm">
          C
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-white text-ink"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-ink p-5 flex flex-col gap-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center font-display font-semibold text-ink text-sm">
                C
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-parchment/60 hover:text-parchment hover:bg-white/5"
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { onTopUp?.(); setMobileOpen(false) }}
                className="flex-1 bg-mint text-white text-sm font-semibold py-2.5 rounded-xl"
              >
                Top up
              </button>
              <button
                onClick={() => { onSend?.(); setMobileOpen(false) }}
                className="flex-1 bg-white/10 text-parchment text-sm font-semibold py-2.5 rounded-xl"
              >
                Send
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-mint text-ink' : 'text-parchment/70 hover:text-parchment hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-1">
              <NavLink
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-mint text-ink' : 'text-parchment/60 hover:text-parchment hover:bg-white/5'
                  }`
                }
              >
                <Settings size={18} strokeWidth={2} />
                Settings
              </NavLink>

              <button
                onClick={() => { onLogout?.(); setMobileOpen(false) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-parchment/60 hover:text-parchment hover:bg-white/5 text-left"
              >
                <LogOut size={18} strokeWidth={2} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}