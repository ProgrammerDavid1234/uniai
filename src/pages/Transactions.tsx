import { useAuth } from '../context/AuthContext'
import { WalletPageFrame } from '../components/WalletPageFrame'
import { useWalletWorkspace } from '../hooks/useWalletWorkspace'
import { formatCurrency, summarizeCategories, timeAgo } from '../lib/wallet'
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react'

export default function Transactions() {
  const { user } = useAuth()
  const { wallet, walletLoading, transactions, txLoading } = useWalletWorkspace(user?.id, 12)
  const breakdown = summarizeCategories(transactions)

  return (
    <WalletPageFrame
      title="Transactions"
      subtitle="A full view of your wallet activity, styled like the dashboard."
      actions={
        <div className="flex gap-3 text-sm">
          <button className="bg-ink text-white px-4 py-2.5 rounded-xl font-semibold">Export</button>
          <button className="border border-line bg-white px-4 py-2.5 rounded-xl font-semibold text-ink/70">Filter</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col gap-6 min-w-0">
          <section className="bg-ink rounded-2xl p-7 text-parchment shadow-card relative overflow-hidden">
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'credit' ? 'bg-mint-soft text-mint' : 'bg-red-50 text-red-500'}`}>
                      {t.type === 'credit' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{t.description ?? 'Transaction'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.category && <span className="text-xs text-ink/50 capitalize">{t.category}</span>}
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
              <div className="text-center py-10 text-ink/50 text-sm">No transactions yet — top up or send money to get started.</div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="font-display text-lg mb-4">Spend by category</h2>
            {breakdown.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {breakdown.map((item) => (
                  <li key={item.category}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium capitalize">{item.category}</span>
                      <span className="text-ink/50">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-1.5 bg-parchment-dim rounded-full overflow-hidden">
                      <div className="h-full bg-mint rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-ink/50">Nothing to break down yet.</div>
            )}
          </section>
        </div>
      </div>
    </WalletPageFrame>
  )
}
