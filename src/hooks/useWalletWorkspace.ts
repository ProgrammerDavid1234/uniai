import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { Transaction, Wallet } from '../lib/wallet'

export function useWalletWorkspace(userId?: string, limit = 8) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [txLoading, setTxLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const loadWallet = async () => {
      setWalletLoading(true)
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle()

      if (cancelled) return
      setWalletLoading(false)

      if (error) {
        setStatusMessage(error.message)
        return
      }

      const nextWallet = (data as Wallet | null) ?? null
      setWallet(nextWallet)

      if (nextWallet) {
        channel = supabase
          .channel(`wallet-${userId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
            (payload) => {
              const row = payload.new as Wallet
              setWallet((current) =>
                current && current.id === row.id ? { ...current, balance: row.balance, updated_at: row.updated_at } : current,
              )
            },
          )
          .subscribe()
      }
    }

    loadWallet()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!wallet) return

    let cancelled = false
    const channel = supabase
      .channel(`transactions-${wallet.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `wallet_id=eq.${wallet.id}` },
        (payload) => {
          const row = payload.new as Transaction
          if (payload.eventType === 'INSERT') {
            setTransactions((current) => (current ? [row, ...current].slice(0, limit) : [row]))
          }
          if (payload.eventType === 'UPDATE') {
            setTransactions((current) => current?.map((item) => (item.id === row.id ? row : item)) ?? [row])
          }
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setTransactions((current) => current?.filter((item) => item.id !== deleted.id) ?? [])
          }
        },
      )
      .subscribe()

    const loadTransactions = async () => {
      setTxLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (cancelled) return
      setTxLoading(false)

      if (error) {
        setStatusMessage(error.message)
        return
      }

      setTransactions((data as Transaction[] | null) ?? [])
    }

    loadTransactions()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [wallet, limit])

  return {
    wallet,
    walletLoading,
    transactions,
    txLoading,
    statusMessage,
    setStatusMessage,
  }
}
