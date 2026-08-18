'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Expense } from '@/lib/types'
import AddExpenseForm from '@/components/AddExpenseForm'
import EditExpenseModal from '@/components/EditExpenseModal'
import AppShell from '@/components/AppShell'

export default function ExpensePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: cats }, { data: exps }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('expenses').select('*').order('created_at', { ascending: true }),
    ])
    setCategories(cats || [])
    setExpenses(exps || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    loadData()
  }

  const filteredExpenses = expenses.filter((e) => {
    if (!search.trim()) return true
    const cat = categories.find((c) => c.id === e.category_id)
    const query = search.toLowerCase()
    return e.remark.toLowerCase().includes(query) || cat?.name.toLowerCase().includes(query)
  })

  const handleExport = () => {
    const rows = [
      ['Remark', 'Category', 'Amount', 'From', 'To'],
      ...filteredExpenses.map((e) => {
        const cat = categories.find((c) => c.id === e.category_id)
        return [e.remark, cat?.name || '', e.total_amount.toString(), e.start_date, e.end_date]
      }),
    ]
    const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-gray-400 pt-10 text-center">Loading...</p>
      </AppShell>
    )
  }

  return (
    <>
      <AppShell>
        <div className="space-y-6 pt-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Expense</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">Add and manage your expenses.</p>
          </div>

          <AddExpenseForm categories={categories} onExpenseAdded={loadData} onCategoryAdded={loadData} />

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-wrap gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Entries</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search remark or category..."
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 text-sm w-48"
                />
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Export CSV
                </button>
              </div>
            </div>
            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-5 pb-5">No entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-gray-100 dark:border-neutral-800 text-left text-gray-400 dark:text-gray-500">
                      <th className="px-5 py-2 font-medium">Remark</th>
                      <th className="px-5 py-2 font-medium">Category</th>
                      <th className="px-5 py-2 font-medium">Amount</th>
                      <th className="px-5 py-2 font-medium">From</th>
                      <th className="px-5 py-2 font-medium">To</th>
                      <th className="px-5 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((e) => {
                      const cat = categories.find((c) => c.id === e.category_id)
                      return (
                        <tr key={e.id} className="border-t border-gray-50 dark:border-neutral-800">
                          <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">
                            {e.remark}
                            {e.is_fixed && (
                              <span className="ml-2 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">Fixed</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                              {cat?.name}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-gray-900 dark:text-gray-100 font-medium">₹{e.total_amount}</td>
                          <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{e.start_date}</td>
                          <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{e.end_date}</td>
                          <td className="px-5 py-2.5">
                            <button onClick={() => setEditingExpense(e)} className="text-indigo-500 hover:text-indigo-700 text-xs mr-3">Edit</button>
                            <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={categories}
          onClose={() => setEditingExpense(null)}
          onSaved={loadData}
        />
      )}
    </>
  )
}