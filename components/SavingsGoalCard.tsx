'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SavingsGoal } from '@/lib/types'

export default function SavingsGoalCard({
  year,
  month,
  netSavings,
  goal,
  onGoalUpdated,
}: {
  year: number
  month: number
  netSavings: number
  goal: SavingsGoal | undefined
  onGoalUpdated: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(goal?.target_amount?.toString() || '')

  const handleSave = async () => {
    if (!target || Number(target) <= 0) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('savings_goals').upsert(
      { user_id: user.id, year, month, target_amount: Number(target) },
      { onConflict: 'user_id,year,month' }
    )
    setEditing(false)
    onGoalUpdated()
  }

  const pct = goal ? Math.min(100, Math.max(0, (netSavings / goal.target_amount) * 100)) : 0

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Savings Goal</h2>
        <button onClick={() => setEditing(!editing)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          {goal ? 'Edit' : 'Set goal'}
        </button>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target amount"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 text-sm"
          />
          <button onClick={handleSave} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Save</button>
        </div>
      ) : goal ? (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">₹{netSavings.toFixed(0)} of ₹{goal.target_amount.toFixed(0)}</span>
            <span className="text-gray-500 dark:text-gray-400">{pct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">No goal set for this month yet.</p>
      )}
    </div>
  )
}