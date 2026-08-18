'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Expense, Income, SavingsGoal } from '@/lib/types'
import { getMonthPortion, getDayPortion } from '@/lib/splitExpense'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import AppShell from '@/components/AppShell'
import SavingsGoalCard from '@/components/SavingsGoalCard'
import CategoryCard from '@/components/CategoryCard'
// import YearlyTrend from '@/components/YearlyTrend'

const ICONS: Record<string, string> = {
  rent: '🏠', travel: '✈️', food: '🍽️', grocery: '🛒', groceries: '🛒',
  gym: '💪', utilities: '💡', shopping: '🛍️', entertainment: '🎬',
}
const getIcon = (name: string) => ICONS[name.toLowerCase()] || '📂'

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'monthly' | 'daily'>('monthly')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: cats }, { data: exps }, { data: inc }, { data: goals }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('income').select('*').order('created_at', { ascending: false }),
      supabase.from('savings_goals').select('*'),
    ])
    setCategories(cats || [])
    setExpenses(exps || [])
    setIncome(inc || [])
    setSavingsGoals(goals || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth > 11) { newMonth = 0; newYear++ }
    if (newMonth < 0) { newMonth = 11; newYear-- }
    setMonth(newMonth)
    setYear(newYear)
  }

  const categoryBreakdown = categories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category_id === cat.id)
    const items = catExpenses
      .map((e) => ({
        remark: e.remark,
        amount: view === 'monthly'
          ? getMonthPortion(e.total_amount, e.start_date, e.end_date, year, month)
          : getDayPortion(e.total_amount, e.start_date, e.end_date, selectedDate),
      }))
      .filter((item) => item.amount > 0)
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    return { category: cat, total, items }
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)

  const periodTotal = categoryBreakdown.reduce((sum, c) => sum + c.total, 0)

  const monthIncomeTotal = income.filter((i) => i.month === month && i.year === year).reduce((sum, i) => sum + i.amount, 0)
  const monthExpenseTotal = categories.reduce((sum, cat) => {
    const catExpenses = expenses.filter((e) => e.category_id === cat.id)
    return sum + catExpenses.reduce((s, e) => s + getMonthPortion(e.total_amount, e.start_date, e.end_date, year, month), 0)
  }, 0)
  const netSavings = monthIncomeTotal - monthExpenseTotal
  const savingsPercent = monthIncomeTotal > 0 ? Math.round((netSavings / monthIncomeTotal) * 100) : 0

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevMonthExpenseTotal = categories.reduce((sum, cat) => {
    const catExpenses = expenses.filter((e) => e.category_id === cat.id)
    return sum + catExpenses.reduce((s, e) => s + getMonthPortion(e.total_amount, e.start_date, e.end_date, prevYear, prevMonth), 0)
  }, 0)
  const monthChange = prevMonthExpenseTotal > 0 ? ((monthExpenseTotal - prevMonthExpenseTotal) / prevMonthExpenseTotal) * 100 : 0
  const currentGoal = savingsGoals.find((g) => g.year === year && g.month === month)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const chartData = last7Days.map((date) => {
    const dayExpense = categories.reduce((sum, cat) => {
      const catExpenses = expenses.filter((e) => e.category_id === cat.id)
      return sum + catExpenses.reduce((s, e) => s + getDayPortion(e.total_amount, e.start_date, e.end_date, date), 0)
    }, 0)
    return { date: date.slice(5), expense: Math.round(dayExpense) }
  })

  const recentTransactions = expenses.slice(0, 5).map((e) => {
    const cat = categories.find((c) => c.id === e.category_id)
    return { ...e, categoryName: cat?.name || 'Unknown', categoryColor: cat?.color || '#999' }
  })

  if (loading) {
    return (
      <AppShell>
        <p className="text-gray-400 pt-10 text-center">Loading...</p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6 pt-2">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">Here&apos;s your expense overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1">
              <button onClick={() => setView('monthly')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${view === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>Monthly</button>
              <button onClick={() => setView('daily')} className={`px-3 py-1 rounded-md text-sm font-medium transition ${view === 'daily' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>Daily</button>
            </div>
            {view === 'monthly' ? (
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400">‹</button>
                <span className="font-medium text-gray-800 dark:text-gray-200 w-32 text-center text-sm">{monthNames[month]} {year}</span>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400">›</button>
              </div>
            ) : (
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 text-sm" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-xl shrink-0">💸</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 dark:text-gray-500">Total Expense</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">₹{periodTotal.toFixed(0)}</p>
            </div>
          </div>
          {categoryBreakdown.map(({ category, total }) => (
            <div key={category.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: category.color + '20' }}>
                {getIcon(category.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{category.name}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">₹{total.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Expense — Last 7 Days</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Daily spend trend</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
<Tooltip formatter={(value) => `₹${Number(value)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />                  <Bar dataKey="expense" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Income</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{monthIncomeTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Expense</span>
                <span className="font-medium text-red-500 dark:text-red-400">₹{monthExpenseTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Savings</span>
                <span className={`font-medium ${netSavings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>₹{netSavings.toFixed(0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs mb-2">
              <span className={monthChange > 0 ? 'text-red-500' : 'text-emerald-500'}>
                {monthChange > 0 ? '↑' : '↓'} {Math.abs(monthChange).toFixed(1)}%
              </span>
              <span className="text-gray-400 dark:text-gray-500">vs last month</span>
            </div>
            {monthIncomeTotal > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {savingsPercent >= 0 ? `${savingsPercent}% of income saved` : `${Math.abs(savingsPercent)}% over income`}
              </p>
            )}
          </div>
        </div>

        <SavingsGoalCard year={year} month={month} netSavings={netSavings} goal={currentGoal} onGoalUpdated={loadData} />

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h2>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: t.categoryColor + '20' }}>
                        {getIcon(t.categoryName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.remark}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t.categoryName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{t.total_amount}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t.start_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Spending Categories</h2>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No expenses for this period yet.</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(({ category, total }) => {
                  const pct = periodTotal > 0 ? (total / periodTotal) * 100 : 0
                  return (
                    <div key={category.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">₹{total.toFixed(0)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: category.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Categories</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No expenses for this period yet.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {categoryBreakdown.map(({ category }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  expenses={expenses.filter((e) => e.category_id === category.id)}
                />
              ))}
            </div>
          )}
        </div>

        {categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Expense Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown.map((c) => ({ name: c.category.name, value: c.total }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {categoryBreakdown.map((c) => (<Cell key={c.category.id} fill={c.category.color} />))}
                  </Pie>
<Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
 
        {/* <YearlyTrend year={year} categories={categories} expenses={expenses} /> */}
      </div>
    </AppShell>
  )
}