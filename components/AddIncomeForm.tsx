'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddIncomeForm({
  year,
  month,
  onIncomeAdded,
}: {
  year: number
  month: number
  onIncomeAdded: () => void
}) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!source.trim() || !amount || Number(amount) <= 0) {
      setError('Please fill in source and a valid amount')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error: insertError } = await supabase.from('income').insert({
      user_id: user.id,
      source: source.trim(),
      amount: Number(amount),
      month,
      year,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSource('')
      setAmount('')
      onIncomeAdded()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add Income</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Salary, Freelance"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Income'}
      </button>
    </form>
  )
}