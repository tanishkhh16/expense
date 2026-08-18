'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/expense', label: 'Expense', icon: '💸' },
  { href: '/income', label: 'Income', icon: '💰' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex z-10">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
            pathname === link.href
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span className="text-lg">{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}