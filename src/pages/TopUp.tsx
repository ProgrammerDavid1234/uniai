import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WalletPageFrame } from '../components/WalletPageFrame'
import { useWalletWorkspace } from '../hooks/useWalletWorkspace'
import { formatCurrency, timeAgo } from '../lib/wallet'
import { CreditCard, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

export default function TopUp() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { wallet, walletLoading, transactions, txLoading, statusMessage, setStatusMessage } = useWalletWorkspace(user?.id, 8)
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!wallet) return setError('No wallet found')
    if (!amount || Number(amount) <= 0) return setError('Enter an amount')

    setLoading(true)
    setError(null)

    const { error } = await supabase.rpc('process_transaction', {
      p_wallet_id: wallet.id,
      p_type: 'credit',
      p_amount: Number(amount),
      p_category: 'top-up',
      p_description: 'Manual top-up (demo)',
    })

    setLoading(false)
    if (error) return setError(error.message)

    setStatusMessage('Top-up complete')
    setAmount('')
  }

  return (
    <WalletPageFrame
      title="Top up"
      subtitle="Add money to your wallet using the same dashboard style and flow."
      actions={
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors">
          Back to dashboard
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} className="text-mint" />
            <h2 className="font-display text-lg">Top up form</h2>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4 max-w-lg">
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold mb-1.5">Amount</label>
              <input
                id="amount"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10000"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60">
                {loading ? 'Topping up…' : 'Top up'}
              </button>
            </div>

            <div className="text-xs text-ink/45">This is a mock top-up for demo purposes.</div>
          </form>

          {statusMessage && <div className="mt-4 text-sm text-ink/60">{statusMessage}</div>}
        </section>

        <div className="flex flex-col gap-6">
          <section className="bg-ink rounded-2xl p-6 text-parchment shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-mint/10 blur-2xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider text-parchment/50 font-bold mb-2">Wallet balance</div>
              {walletLoading ? (
                <div className="h-10 w-40 bg-white/10 rounded-lg animate-pulse" />
              ) : wallet ? (
                <div className="font-display text-4xl md:text-5xl">{formatCurrency(wallet.balance)}</div>
              ) : (
                <div className="text-parchment/60">No wallet found</div>
              )}
              <div className="text-sm text-parchment/40 mt-3">{wallet?.updated_at ? `Updated ${timeAgo(wallet.updated_at)}` : ''}</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={15} className="text-mint" />
              <h2 className="font-display text-lg">Recent top-up activity</h2>
            </div>

            {txLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => <div key={index} className="h-12 bg-parchment-dim rounded-xl animate-pulse" />)}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <ul className="space-y-3">
                {transactions.slice(0, 4).map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink/70">{transaction.description ?? 'Transaction'}</span>
                    <span className={`font-semibold ${transaction.type === 'credit' ? 'text-mint' : 'text-ink'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-ink/50">No recent activity yet.</div>
            )}
          </section>
        </div>
      </div>
    </WalletPageFrame>
  )
}
