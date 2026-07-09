import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WalletPageFrame } from '../components/WalletPageFrame'
import { useWalletWorkspace } from '../hooks/useWalletWorkspace'
import { formatCurrency, type Profile } from '../lib/wallet'
import { Search, Send as SendIcon } from 'lucide-react'

export default function Send() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { wallet, walletLoading, transactions, txLoading, statusMessage, setStatusMessage } = useWalletWorkspace(user?.id, 8)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [searching, setSearching] = useState(false)
  const [amount, setAmount] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!query || selected) {
      setResults([])
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profile_search')
        .select('id, email, full_name')
        .ilike('email', `%${query}%`)
        .limit(6)

      if (!mounted) return
      setSearching(false)
      if (error) return setError(error.message)
      setResults(((data as Profile[]) ?? []).filter((item) => item.id !== user?.id))
    }, 300)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [query, selected, user?.id])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!wallet) return setError('No wallet found')
    if (!selected) return setError('Select a recipient')
    if (selected.id === user?.id) return setError("You can't send money to yourself")
    if (!amount || Number(amount) <= 0) return setError('Enter an amount')

    setLoading(true)
    setError(null)

    const { error } = await supabase.rpc('transfer_funds', {
      p_sender_wallet_id: wallet.id,
      p_recipient_user_id: selected.id,
      p_amount: Number(amount),
      p_note: note || null,
    })

    setLoading(false)
    if (error) return setError(error.message)

    setStatusMessage('Transfer submitted')
    setSelected(null)
    setQuery('')
    setAmount('')
    setNote('')
  }

  return (
    <WalletPageFrame
      title="Send money"
      subtitle="Use the same wallet flow from the dashboard, now as a dedicated page."
      actions={
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors">
          Back to dashboard
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <SendIcon size={15} className="text-mint" />
            <h2 className="font-display text-lg">Transfer form</h2>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="recipient" className="block text-sm font-semibold mb-1.5">Recipient</label>
              {selected ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 border border-mint bg-mint-soft rounded-xl">
                  <div>
                    <div className="font-medium text-sm">{selected.full_name ?? selected.email}</div>
                    <div className="text-xs text-ink/50">{selected.email}</div>
                  </div>
                  <button type="button" className="text-xs font-semibold text-ink/60 hover:text-ink" onClick={() => { setSelected(null); setQuery('') }}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                    <input
                      id="recipient"
                      className="w-full pl-9 pr-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by email"
                      autoComplete="off"
                    />
                  </div>
                  {searching && <div className="text-xs text-ink/40 mt-1.5">Searching…</div>}
                  {results.length > 0 && (
                    <ul className="mt-2 border border-line rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                      {results.map((result) => (
                        <li key={result.id} className="px-3.5 py-2.5 flex justify-between items-center cursor-pointer hover:bg-parchment-dim text-sm" onClick={() => { setSelected(result); setResults([]) }}>
                          <span className="font-medium">{result.full_name ?? result.email}</span>
                          <span className="text-ink/40">{result.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {query.length > 2 && !searching && results.length === 0 && <div className="text-xs text-ink/40 mt-1.5">No matching user found.</div>}
                </>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-semibold mb-1.5">Amount</label>
              <input
                id="amount"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-semibold mb-1.5">Note (optional)</label>
              <input
                id="note"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="For coffee"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60">
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>

          {statusMessage && <div className="mt-4 text-sm text-ink/60">{statusMessage}</div>}
        </section>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-2xl p-6 shadow-card">
            <div className="text-xs uppercase tracking-wider text-mint font-bold mb-2">Wallet balance</div>
            {walletLoading ? (
              <div className="h-9 w-32 bg-parchment-dim rounded-lg animate-pulse" />
            ) : wallet ? (
              <div className="font-display text-3xl">{formatCurrency(wallet.balance)}</div>
            ) : (
              <div className="text-sm text-ink/50">No wallet found</div>
            )}
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-display text-lg mb-4">Recent transactions</h2>
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
              <div className="text-sm text-ink/50">No recent transactions yet.</div>
            )}
          </section>
        </div>
      </div>
    </WalletPageFrame>
  )
}
