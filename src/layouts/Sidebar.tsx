import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  X,
  Layers,
  Users,
  Settings,
  History,
  CalendarClock,
} from 'lucide-react'
import Brand from '../components/Brand'
import { useAuth } from '../auth/useAuth'
import { toApiError } from '../api/errors'
import { initials } from '../platform/format'

const navigation = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Building2 },
  { path: '/stores', label: 'Stores', icon: Store },
  { path: '/plans', label: 'Plans', icon: Layers },
  { path: '/subscriptions', label: 'Subscriptions', icon: CalendarClock },
  { path: '/administrators', label: 'Administrators', icon: Users },
  { path: '/activity', label: 'Activity log', icon: History },
  { path: '/settings', label: 'Profile & security', icon: Settings },
]
export default function Sidebar({ close }: { close: () => void }) {
  const { user, logout } = useAuth(),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    busy = useRef(false)
  async function signOut() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await logout()
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <>
      <div className="flex items-start justify-between gap-2 px-6 pb-8 pt-8">
        <Link to="/dashboard" onClick={close} aria-label="Sarisari admin home">
          <Brand light />
        </Link>
        <button
          className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10 lg:hidden"
          onClick={close}
          aria-label="Close navigation"
        >
          <X size={19} />
        </button>
      </div>
      <div className="mx-5 mb-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
        <span className="grid size-9 place-items-center rounded-lg bg-[#bdd5b0]/10 text-[#bdd5b0]">
          <ShieldCheck size={19} />
        </span>
        <div>
          <strong className="block text-xs font-medium text-white/85">Platform workspace</strong>
          <span className="mt-1 block text-[10px] text-white/35">Administrator access</span>
        </div>
      </div>
      <div className="px-5">
        <p className="mb-3 px-3 text-[9px] font-semibold tracking-[.17em] text-white/30">
          YOUR WORKSPACE
        </p>
        <nav aria-label="Main navigation" className="space-y-1.5">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={close}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition ${isActive ? 'bg-[#e4eddd] text-sidebar shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white'}`
              }
            >
              <item.icon size={18} strokeWidth={1.7} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mx-5 mb-6 mt-auto pt-12">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs font-medium text-[#cfdec4]">A growing community.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            A clear view of the accounts and stores behind Sarisari.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5">
        {error && (
          <p role="alert" className="mb-3 text-xs text-red-200">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-semibold text-[#c5d8b8]">
            {initials(user?.name ?? '')}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-medium text-white/85">
              {user?.name}
            </strong>
            <span className="mt-1 block truncate text-[10px] text-white/35">{user?.email}</span>
          </div>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label={pending ? 'Signing out' : 'Sign out'}
            disabled={pending}
            onClick={() => void signOut()}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </>
  )
}
