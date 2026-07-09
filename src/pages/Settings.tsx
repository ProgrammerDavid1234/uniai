import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WalletPageFrame } from '../components/WalletPageFrame'
import { LogOut, Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <WalletPageFrame title="Settings" subtitle="Account details and app preferences in the same dashboard style.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={15} className="text-mint" />
            <h2 className="font-display text-lg">Account</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <span className="text-ink/50">Signed in as</span>
              <span className="font-medium text-right truncate">{user?.email ?? 'Unknown'}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-3">
              <span className="text-ink/50">User ID</span>
              <span className="font-medium text-right truncate max-w-[18rem]">{user?.id ?? '—'}</span>
            </div>
          </div>

          <button onClick={logout} className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-ink-soft transition-colors">
            <LogOut size={16} />
            Log out
          </button>
        </section>

        <section className="bg-ink rounded-2xl p-6 text-parchment shadow-card">
          <div className="text-xs uppercase tracking-wider text-parchment/50 font-bold mb-2">App theme</div>
          <div className="font-display text-2xl mb-3">Campus Wallet</div>
          <p className="text-sm text-parchment/70 leading-6">
            This settings screen matches the dashboard language: clean cards, dark accent sections, and mint highlights.
          </p>
        </section>
      </div>
    </WalletPageFrame>
  )
}
