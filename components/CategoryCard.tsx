'use client'

import { useState } from 'react'
import { Category, Expense } from '@/lib/types'
import { getMonthPortion, getDayPortion } from '@/lib/splitExpense'

export default function CategoryCard({
  category,
  expenses,
}: {
  category: Category
  expenses: Expense[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'monthly' | 'daily'>('monthly')
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().split('T')[0])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth > 11) { newMonth = 0; newYear++ }
    if (newMonth < 0) { newMonth = 11; newYear-- }
    setMonth(newMonth)
    setYear(newYear)
  }

  // Group by subcategory (fallback to remark if no subcategory set)
  const grouped: Record<string, number> = {}
  let total = 0
  for (const e of expenses) {
    const amount = view === 'monthly'
      ? getMonthPortion(e.total_amount, e.start_date, e.end_date, year, month)
      : getDayPortion(e.total_amount, e.start_date, e.end_date, selectedDate)
    if (amount <= 0) continue
    const key = e.subcategory?.trim() || e.remark
    grouped[key] = (grouped[key] || 0) + amount
    total += amount
  }
  const groupedList = Object.entries(grouped).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
          <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">₹{total.toFixed(2)}</span>
          <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-neutral-800 pt-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1 bg-gray-50 dark:bg-neutral-800 rounded-lg p-0.5">
              <button onClick={() => setView('monthly')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === 'monthly' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</button>
              <button onClick={() => setView('daily')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${view === 'daily' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Daily</button>
            </div>
            {view === 'monthly' ? (
              <div className="flex items-center gap-1 text-xs">
                <button onClick={() => changeMonth(-1)} className="w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400">‹</button>
                <span className="text-gray-600 dark:text-gray-400 w-20 text-center">{monthNames[month]} {year}</span>
                <button onClick={() => changeMonth(1)} className="w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400">›</button>
              </div>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 text-xs"
              />
            )}
          </div>

          {groupedList.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No items in this period.</p>
          ) : (
            <div className="space-y-1.5">
              {groupedList.map(([key, amount]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{key}</span>
                  <span className="text-gray-800 dark:text-gray-200">₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}