'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Income } from '@/lib/types'
import AddIncomeForm from '@/components/AddIncomeForm'
import AppShell from '@/components/AppShell'

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('income').select('*').order('created_at', { ascending: true })
    setIncome(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('income').delete().eq('id', id)
    loadData()
  }

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
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Income</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add and manage your income entries.</p>
        </div>

        <AddIncomeForm year={year} month={month} onIncomeAdded={loadData} />

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 px-5 pt-5 pb-3">All Entries</h2>
          {income.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 px-5 pb-5">No entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-100 dark:border-neutral-800 text-left text-gray-400 dark:text-gray-500">
                    <th className="px-5 py-2 font-medium">Source</th>
                    <th className="px-5 py-2 font-medium">Amount</th>
                    <th className="px-5 py-2 font-medium">Month</th>
                    <th className="px-5 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((i) => (
                    <tr key={i.id} className="border-t border-gray-50 dark:border-neutral-800">
                      <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">{i.source}</td>
                      <td className="px-5 py-2.5 text-gray-900 dark:text-gray-100 font-medium">₹{i.amount}</td>
                      <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{monthNames[i.month]} {i.year}</td>
                      <td className="px-5 py-2.5">
                        <button onClick={() => handleDelete(i.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}