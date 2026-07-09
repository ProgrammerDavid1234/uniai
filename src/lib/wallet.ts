export type Wallet = {
  id: string
  user_id: string
  balance: number
  updated_at: string
}

export type Transaction = {
  id: string
  wallet_id: string
  amount: number
  type: 'credit' | 'debit'
  description: string | null
  category: string | null
  ai_flagged: boolean | null
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
}

export function formatCurrency(value: number) {
  return `₦${value.toLocaleString()}`
}

export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function summarizeCategories(transactions: Transaction[] | null) {
  if (!transactions) return []

  const debits = transactions.filter((transaction) => transaction.type === 'debit' && transaction.category)
  const totals = new Map<string, number>()
  let total = 0

  for (const transaction of debits) {
    totals.set(transaction.category!, (totals.get(transaction.category!) ?? 0) + transaction.amount)
    total += transaction.amount
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      total: amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
}
