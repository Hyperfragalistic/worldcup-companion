import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children:   ReactNode
  /** Hide BottomNav on full-screen pages like MatchPage */
  hideNav?:   boolean
  className?: string
}

export default function Layout({ children, hideNav = false, className = '' }: LayoutProps) {
  return (
    <div className="flex h-dvh flex-col bg-wc-dark pt-safe">
      <main className={`flex-1 overflow-y-auto ${className}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
