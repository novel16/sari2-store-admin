import { ChevronRight, Menu, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { initials } from '../platform/format'

export default function AdminHeader({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const { pathname } = useLocation(),
    { user } = useAuth(),
    section = pathname.startsWith('/accounts')
      ? 'Accounts'
      : pathname.startsWith('/stores')
        ? 'Stores'
        : pathname.startsWith('/plans')
          ? 'Plans'
          : pathname.startsWith('/administrators')
            ? 'Administrators'
            : pathname.startsWith('/subscription-payments')
              ? 'Subscription payments'
              : pathname.startsWith('/subscriptions')
                ? 'Subscriptions'
                : pathname.startsWith('/settings')
                  ? 'Profile & security'
                  : pathname.startsWith('/activity')
                    ? 'Activity log'
                    : 'Overview'
  const detail = /\/(accounts|stores|plans|administrators)\/(\d+|new)(?:\/subscription)?$/.test(
    pathname,
  )
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-3 border-b border-[#e1e7e3] bg-[#fbfcfa]/95 px-5 backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="icon-button -ml-2 lg:hidden"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={onOpen}
        >
          <Menu size={21} />
        </button>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[11px] text-slate-400"
        >
          <span className="hidden sm:block">Admin workspace</span>
          <ChevronRight size={12} className="hidden sm:block" />
          {detail ? (
            <>
              <Link
                className="hover:text-brand"
                to={
                  section === 'Accounts'
                    ? '/accounts'
                    : section === 'Plans'
                      ? '/plans'
                      : section === 'Administrators'
                        ? '/administrators'
                        : '/stores'
                }
              >
                {section}
              </Link>
              <ChevronRight size={12} />
              <span className="font-medium text-ink">
                {pathname.endsWith('/subscription') ? 'Subscription' : 'Details'}
              </span>
            </>
          ) : (
            <span className="font-medium text-ink">{section}</span>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 rounded-full bg-brand/5 px-3 py-1.5 text-[10px] font-medium text-brand sm:inline-flex">
          <ShieldCheck size={12} />
          Platform administrator
        </span>
        <Link
          to="/settings"
          aria-label="My profile and security"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7e9e1] text-[11px] font-semibold text-brand"
        >
          {initials(user?.name ?? '')}
        </Link>
      </div>
    </header>
  )
}
