import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Sidebar } from '../components/Sidebar'
import { LogOut, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react'
declare global {
  interface Window {
    PaystackPop: any
  }
}
type Wallet = { id: string; user_id: string; balance: number; updated_at: string }
type Transaction = {
    id: string; wallet_id: string; amount: number; type: 'credit' | 'debit'
    description: string | null; category: string | null; ai_flagged: boolean | null; created_at: string
}
type Profile = { id: string; email: string; full_name: string | null }

function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [walletLoading, setWalletLoading] = useState(true)
    const [transactions, setTransactions] = useState<Transaction[] | null>(null)
    const [txLoading, setTxLoading] = useState(true)
    const [sendOpen, setSendOpen] = useState(false)
    const [topUpOpen, setTopUpOpen] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [insight, setInsight] = useState<string | null>(null)
    const [insightLoading, setInsightLoading] = useState(false)
    const [budgetWarning, setBudgetWarning] = useState<string | null>(null)

    const generateInsight = async () => {
        if (!user) return
        setInsightLoading(true)
        const { data, error } = await supabase.functions.invoke('generate-insights', {
            body: { user_id: user.id },
            headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
        })
        setInsightLoading(false)
        if (!error && data?.insight) {
            setInsight(data.insight.content)
        } else if (error) {
            setStatusMessage('Could not generate insight')
        }
    }
    useEffect(() => {
        if (!user) return
        supabase.from('profile_search').select('id, email, full_name').eq('id', user.id).maybeSingle()
            .then(({ data }) => setProfile((data as Profile) ?? null))
    }, [user])
    useEffect(() => {
        console.log('SUPABASE URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('ANON KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)
    }, [])
    useEffect(() => {
        if (!wallet || !user) return
        supabase.functions
            .invoke('budget-alert', {
                headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
            })
            .then(({ data, error }) => {
                if (!error && data?.warning) {
                    setBudgetWarning(data.message)
                }
            })
    }, [wallet?.id, user])
    useEffect(() => {
        if (!user) return
        let channel: ReturnType<typeof supabase.channel> | null = null
        let cancelled = false

        setWalletLoading(true)
        supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
            if (cancelled) return
            setWalletLoading(false)
            if (error) return setStatusMessage(error.message)
            setWallet((data as Wallet) ?? null)

            if (data) {
                channel = supabase
                    .channel(`wallet-${user.id}-${Date.now()}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
                        (payload) => {
                            const row = payload.new as Wallet
                            setWallet((w) => (w && w.id === row.id ? { ...w, balance: row.balance, updated_at: row.updated_at } : w))
                        }
                    )
                    .subscribe()
            }
        })

        return () => {
            cancelled = true
            if (channel) supabase.removeChannel(channel)
        }
    }, [user])
    useEffect(() => {
        if (!wallet) return
        let mounted = true

        setTxLoading(true)
        supabase.from('transactions').select('*').eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false }).limit(8)
            .then(({ data, error }) => {
                if (!mounted) return
                setTxLoading(false)
                if (error) return setStatusMessage(error.message)
                setTransactions((data as Transaction[]) ?? [])
            })

        const channel = supabase
            .channel(`transactions-${wallet.id}-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `wallet_id=eq.${wallet.id}` },
                (payload) => {
                    const rec = payload.new as Transaction
                    if (payload.eventType === 'INSERT') setTransactions((t) => (t ? [rec, ...t].slice(0, 8) : [rec]))
                    else if (payload.eventType === 'UPDATE') setTransactions((t) => t?.map((x) => (x.id === rec.id ? rec : x)) ?? [rec])
                    else if (payload.eventType === 'DELETE') setTransactions((t) => t?.filter((x) => x.id !== (payload.old as any).id) ?? [])
                }
            )
            .subscribe()

        return () => {
            mounted = false
            supabase.removeChannel(channel)
        }
    }, [wallet])
    const formatCurrency = (n: number) => `₦${n.toLocaleString()}`
    const logout = async () => { await supabase.auth.signOut(); navigate('/login') }

    const refetchAll = async () => {
        if (!wallet) return
        const { data: w } = await supabase.from('wallets').select('*').eq('id', wallet.id).maybeSingle()
        setWallet((w as Wallet) ?? wallet)
        const { data: t } = await supabase.from('transactions').select('*').eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false }).limit(8)
        setTransactions((t as Transaction[]) ?? [])
    }

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const weeklyCategories = summarizeCategories(transactions)

    return (
        <div className="min-h-screen bg-parchment-dim font-body text-ink p-4 md:p-7">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-6">
                <Sidebar />

                <div className="flex-1 min-w-0">
                    {/* Header */}
                   <header className="hidden md:flex items-center justify-between mb-6">
    <div>
        <div className="text-xs uppercase tracking-wider text-mint font-bold mb-1">Campus Wallet</div>
        <h1 className="font-display text-2xl md:text-3xl">Hi, {firstName}!</h1>
    </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTopUpOpen(true)}
                                className="bg-mint hover:bg-mint/90 transition-colors text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-card"
                            >
                                Top up
                            </button>
                            <button
                                onClick={() => setSendOpen(true)}
                                className="bg-ink hover:bg-ink-soft transition-colors text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-card"
                            >
                                Send
                            </button>
                            <button
                                onClick={logout}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-line text-ink/60 hover:text-ink hover:border-ink/30 transition-colors bg-white"
                                title="Log out"
                            >
                                <LogOut size={17} />
                            </button>
                        </div>
                    </header>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                        {/* Left column */}
                        <div className="flex flex-col gap-6 min-w-0">
                            {/* Balance card */}
                            <section className="bg-ink rounded-xl2 p-7 text-parchment shadow-card relative overflow-hidden">
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
                                    <div className="text-sm text-parchment/40 mt-3">
                                        {wallet?.updated_at ? `Updated ${timeAgo(wallet.updated_at)}` : ''}
                                    </div>
                                </div>
                            </section>

                            {/* Transactions */}
                            <section className="bg-white rounded-xl2 p-6 shadow-card flex-1">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-display text-lg">Recent transactions</h2>
                                </div>

                                {txLoading ? (
                                    <div className="flex flex-col gap-3">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-14 bg-parchment-dim rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : transactions && transactions.length > 0 ? (
                                    <ul className="flex flex-col divide-y divide-line">
                                        {transactions.map((t) => (
                                            <li key={t.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'credit' ? 'bg-mint-soft text-mint' : 'bg-red-50 text-red-500'
                                                        }`}
                                                >
                                                    {t.type === 'credit' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-sm truncate">{t.description ?? 'Transaction'}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {t.category && (
                                                            <span className="text-xs text-ink/50 capitalize">{t.category}</span>
                                                        )}
                                                        {t.ai_flagged && (
                                                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                                <Sparkles size={11} /> AI flagged
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className={`font-bold text-sm ${t.type === 'credit' ? 'text-mint' : 'text-ink'}`}>
                                                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </div>
                                                    <div className="text-xs text-ink/40 mt-0.5">{timeAgo(t.created_at)}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-10 text-ink/50 text-sm">
                                        No transactions yet — top up or send money to get started.
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right column */}
                        <div className="flex flex-col gap-6">
                            {/* Quick actions card */}
                            <section className="bg-white rounded-xl2 p-6 shadow-card">
                                <h2 className="font-display text-lg mb-4">Quick actions</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTopUpOpen(true)}
                                        className="flex flex-col items-center justify-center gap-2 bg-mint-soft hover:bg-mint/20 transition-colors rounded-xl py-5 text-mint font-semibold text-sm"
                                    >
                                        <ArrowDownLeft size={20} />
                                        Top up
                                    </button>
                                    <button
                                        onClick={() => setSendOpen(true)}
                                        className="flex flex-col items-center justify-center gap-2 bg-parchment-dim hover:bg-line transition-colors rounded-xl py-5 text-ink font-semibold text-sm"
                                    >
                                        <ArrowUpRight size={20} />
                                        Send
                                    </button>
                                </div>
                            </section>

                            {/* Spend breakdown */}
                            <section className="bg-white rounded-xl2 p-6 shadow-card">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={15} className="text-mint" />
                                    <h2 className="font-display text-lg">Spend by category</h2>
                                </div>
                                {weeklyCategories.length > 0 ? (
                                    <ul className="flex flex-col gap-3">
                                        {weeklyCategories.map((c) => (
                                            <li key={c.category}>
                                                <div className="flex justify-between text-sm mb-1.5">
                                                    <span className="font-medium capitalize">{c.category}</span>
                                                    <span className="text-ink/50">{formatCurrency(c.total)}</span>
                                                </div>
                                                <div className="h-1.5 bg-parchment-dim rounded-full overflow-hidden">
                                                    <div className="h-full bg-mint rounded-full" style={{ width: `${c.percent}%` }} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-ink/50">Nothing to break down yet.</div>
                                )}
                            </section>

                            <section className="bg-white rounded-xl2 p-6 shadow-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={15} className="text-mint" />
                                        <h2 className="font-display text-lg">AI insight</h2>
                                    </div>
                                    <button
                                        onClick={generateInsight}
                                        disabled={insightLoading}
                                        className="text-xs font-semibold text-mint hover:text-mint/80 disabled:opacity-50"
                                    >
                                        {insightLoading ? 'Thinking…' : insight ? 'Refresh' : 'Generate'}
                                    </button>
                                </div>
                                {insight ? (
                                    <p className="text-sm text-ink/70 leading-relaxed">{insight}</p>
                                ) : (
                                    <p className="text-sm text-ink/40">Get an AI summary of your spending this week.</p>
                                )}
                            </section>
                        </div>
                    </div>

                    {budgetWarning && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl2 p-4 mb-6">
                            <Sparkles size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-sm mb-0.5">Budget alert</div>
                                <div className="text-sm">{budgetWarning}</div>
                            </div>
                            <button
                                onClick={() => setBudgetWarning(null)}
                                className="ml-auto text-amber-600 hover:text-amber-800 text-sm font-semibold shrink-0"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {sendOpen && wallet && user && (
                <SendModal
                    walletId={wallet.id}
                    currentUserId={user.id}
                    onClose={() => setSendOpen(false)}
                    onSuccess={() => { setSendOpen(false); refetchAll(); setStatusMessage('Transfer submitted') }}
                />
            )}
          {topUpOpen && wallet && user && (
  <TopUpModal
    walletId={wallet.id}
    userEmail={user.email!}
    onClose={() => setTopUpOpen(false)}
    onSuccess={() => { setTopUpOpen(false); refetchAll(); setStatusMessage('Payment successful — updating balance…') }}
  />
)}
            {statusMessage && (
                <div className="fixed right-6 bottom-6 bg-ink text-white px-4 py-3 rounded-xl shadow-card text-sm font-medium"
                    onAnimationEnd={() => setTimeout(() => setStatusMessage(null), 2500)}>
                    {statusMessage}
                </div>
            )}
        </div>
    )
}


function summarizeCategories(transactions: Transaction[] | null) {
    if (!transactions) return []
    const debits = transactions.filter((t) => t.type === 'debit' && t.category)
    const totals = new Map<string, number>()
    let grand = 0
    for (const t of debits) {
        totals.set(t.category!, (totals.get(t.category!) ?? 0) + t.amount)
        grand += t.amount
    }
    return Array.from(totals.entries())
        .map(([category, total]) => ({ category, total, percent: grand ? Math.round((total / grand) * 100) : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4)
}

function SendModal({
    walletId,
    currentUserId,
    onClose,
    onSuccess,
}: {
    walletId: string
    currentUserId: string
    onClose: () => void
    onSuccess: () => void
}) {
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
        const t = setTimeout(async () => {
            const { data, error } = await supabase
                .from('profile_search')
                .select('id, email, full_name')
                .ilike('email', `%${query}%`)
                .limit(6)
            if (!mounted) return
            setSearching(false)
            if (error) return setError(error.message)
            const found = ((data as Profile[]) ?? []).filter((r) => r.id !== currentUserId)
            setResults(found)

            const exact = found.find((r) => r.email.toLowerCase() === query.toLowerCase())
            if (exact) setSelected(exact)
        }, 300)
        return () => { mounted = false; clearTimeout(t) }
    }, [query, selected, currentUserId])

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!selected) return setError('Select a recipient')
        if (selected.id === currentUserId) return setError("You can't send money to yourself")
        if (!amount || Number(amount) <= 0) return setError('Enter an amount')

        setLoading(true)
        setError(null)

        const { data, error } = await supabase.rpc('transfer_funds', {
            p_sender_wallet_id: walletId,
            p_recipient_user_id: selected.id,
            p_amount: Number(amount),
            p_note: note || null,
        })

        setLoading(false)
        if (error) return setError(error.message)

        const senderTxId = data?.sender_transaction?.id
        if (senderTxId) {
            supabase.functions.invoke('categorize-transaction', {
                body: { transaction_id: senderTxId },
                headers: {
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
            })
        }

        onSuccess()
    }
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/50 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-xl2 p-7 w-full max-w-md shadow-card">
                <h3 className="font-display text-xl mb-5">Send money</h3>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-semibold mb-1.5">Recipient</label>

                        {selected ? (
                            <div className="flex items-center justify-between px-3.5 py-2.5 border border-mint bg-mint-soft rounded-xl">
                                <div>
                                    <div className="font-medium text-sm">{selected.full_name ?? selected.email}</div>
                                    <div className="text-xs text-ink/50">{selected.email}</div>
                                </div>
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-ink/60 hover:text-ink"
                                    onClick={() => { setSelected(null); setQuery('') }}
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    id="recipient"
                                    className="w-full px-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by email"
                                    autoComplete="off"
                                />
                                {searching && <div className="text-xs text-ink/40 mt-1.5">Searching…</div>}
                                {results.length > 0 && (
                                    <ul className="mt-2 border border-line rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                        {results.map((r) => (
                                            <li
                                                key={r.id}
                                                className="px-3.5 py-2.5 flex justify-between items-center cursor-pointer hover:bg-parchment-dim text-sm"
                                                onClick={() => { setSelected(r); setResults([]) }}
                                            >
                                                <span className="font-medium">{r.full_name ?? r.email}</span>
                                                <span className="text-ink/40">{r.email}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {query.length > 2 && !searching && results.length === 0 && (
                                    <div className="text-xs text-ink/40 mt-1.5">No matching user found.</div>
                                )}
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
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Sending…' : 'Send'}
                        </button>
                    </div>


                </form>
            </div>
        </div>
    )
}

function TopUpModal({ walletId, userEmail, onClose, onSuccess }: {
  walletId: string
  userEmail: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payWithPaystack = () => {
    if (!amount || Number(amount) <= 0) return setError('Enter an amount')
    setError(null)
    setLoading(true)

    const handler = window.PaystackPop.setup({
      key: 'pk_test_03d82a8949bd3c17ad67b19bc2a1828013da4b16', 
      email: userEmail,
      amount: Number(amount) * 100, // Paystack expects kobo
      currency: 'NGN',
      metadata: { wallet_id: walletId },
      callback: () => {
        setLoading(false)
        onSuccess()
      },
      onClose: () => {
        setLoading(false)
      },
    })
    handler.openIframe()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl2 p-7 w-full max-w-md shadow-card">
        <h3 className="font-display text-xl mb-5">Top up wallet</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Amount</label>
            <input
              className="w-full px-3.5 py-2.5 border border-line rounded-xl outline-none focus:border-mint focus:ring-2 focus:ring-mint-soft transition-shadow"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              autoFocus
            />
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div className="text-xs text-ink/40">
            Test mode — use card <span className="font-mono">4084 0840 8408 4081</span>, any future expiry, CVV 408, PIN 0000, OTP 123456.
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold hover:bg-parchment-dim transition-colors">
              Cancel
            </button>
            <button onClick={payWithPaystack} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:bg-mint/90 transition-colors disabled:opacity-60">
              {loading ? 'Processing…' : 'Pay with card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}