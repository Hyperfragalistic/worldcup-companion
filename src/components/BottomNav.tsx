import { NavLink } from 'react-router-dom'
import { CalendarDays, User } from 'lucide-react'

const TABS = [
  { to: '/',        label: 'Schedule', Icon: CalendarDays },
  { to: '/profile', label: 'Profile',  Icon: User },
] as const

export default function BottomNav() {
  return (
    <nav className="flex h-16 items-stretch border-t border-white/10 bg-wc-surface pb-safe">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
              isActive ? 'text-wc-gold' : 'text-gray-500 hover:text-gray-300'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
