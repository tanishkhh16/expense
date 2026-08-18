'use client'

import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ThemeToggle from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Sidebar />
      <div className="flex-1 pb-16 md:pb-0">
        <header className="border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 md:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Expense Tracker</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={handleLogout} className="text-sm text-gray-500 dark:text-gray-400 px-2">Log out</button>
            </div>
          </div>
        </header>
        <div className="hidden md:flex justify-end items-center gap-2 px-6 py-4">
          <ThemeToggle />
          <button onClick={handleLogout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5">Log out</button>
        </div>
        <main className="max-w-4xl mx-auto px-4 pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}