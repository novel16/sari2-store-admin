import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  Store,
} from 'lucide-react'
import Brand from '../../components/Brand'
import { useAuth } from '../../auth/useAuth'
import { toApiError } from '../../api/errors'
import type { ApiError } from '../../api/errors'

export default function LoginForm() {
  const { login } = useAuth(),
    [show, setShow] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState<ApiError | null>(null)
  const busy = useRef(false)
  const location = useLocation()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const form = new FormData(event.currentTarget)
    busy.current = true
    setPending(true)
    setError(null)
    try {
      await login({
        email: String(form.get('email')).trim().toLowerCase(),
        password: String(form.get('password')),
        remember: form.get('remember') === 'on',
      })
    } catch (failure) {
      setError(toApiError(failure))
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <main className="grid min-h-dvh lg:grid-cols-[.95fr_1.05fr]">
      <section className="relative hidden flex-col overflow-hidden bg-sidebar p-12 text-white lg:flex xl:p-16">
        <Brand light />
        <div className="absolute -right-28 top-36 size-96 rounded-full border border-white/5" />
        <div className="absolute -right-8 top-56 size-56 rounded-full border border-white/5" />
        <div className="relative my-auto py-16">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#c5d8b8]">
            A little clarity. A wider view.
          </p>
          <h2 className="max-w-md font-display text-5xl font-bold leading-[1.15] tracking-[-2px]">
            Good stores start with good oversight.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-loose text-white/50">
            One workspace to understand your growing community of stores and keep the platform
            running smoothly.
          </p>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-3">
            {[
              { label: 'Accounts', icon: Building2 },
              { label: 'Stores', icon: Store },
              { label: 'Platform access', icon: ShieldCheck },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <item.icon size={22} className="mb-4 text-[#c5d8b8]" strokeWidth={1.5} />
                <p className="text-[11px] font-medium text-white/70">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] tracking-wide text-white/30">
          Sarisari · Your everyday store partner.
        </p>
      </section>
      <section className="flex min-w-0 flex-col bg-[#fbfcfa] p-6 sm:p-12">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            <ShieldCheck size={13} />
            Admin workspace
          </span>
          <h1 className="font-display text-3xl font-bold tracking-[-1px]">Welcome back.</h1>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-slate-500">
            Sign in with your platform administrator account.
          </p>
          {location.state &&
            typeof location.state === 'object' &&
            location.state.passwordReset === true && (
              <p
                role="status"
                className="mb-5 rounded-xl border border-brand/15 bg-brand/5 p-3 text-xs leading-relaxed text-brand"
              >
                Your password has been reset. Sign in with your new password.
              </p>
            )}
          <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
            <fieldset disabled={pending} className="space-y-5">
              <label className="field">
                <span>Email address</span>
                <input
                  className="input"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(error?.fields.email)}
                />
                {error?.fields.email?.[0] && (
                  <small className="text-red-700">{error.fields.email[0]}</small>
                )}
              </label>
              <label className="field">
                <span>Password</span>
                <span className="relative">
                  <input
                    className="input !pr-12"
                    name="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    maxLength={72}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(error?.fields.password)}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 grid size-9 place-items-center text-slate-400"
                    aria-label={show ? 'Hide password' : 'Show password'}
                    aria-pressed={show}
                    onClick={() => setShow((value) => !value)}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
                {error?.fields.password?.[0] && (
                  <small className="text-red-700">{error.fields.password[0]}</small>
                )}
              </label>
              <div className="flex items-center justify-between gap-3">
                <label className="flex min-h-7 items-center gap-2.5 text-xs text-slate-500">
                  <input type="checkbox" name="remember" className="size-4 rounded" />
                  Keep me signed in
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
                >
                  {error.message}
                </p>
              )}
              <button className="btn btn-primary w-full" type="submit">
                {pending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}{' '}
                {pending ? 'Signing in…' : 'Sign in to admin'}
              </button>
            </fieldset>
          </form>
          <p className="mt-7 text-center text-[11px] leading-relaxed text-slate-400">
            Access is managed by your platform administrator.
          </p>
          <a
            className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-xs font-medium text-brand"
            href={import.meta.env.VITE_CLIENT_URL || 'http://localhost:3000'}
          >
            Open store app <ArrowUpRight size={13} />
          </a>
        </div>
        <p className="text-center text-[10px] text-slate-400">Sarisari platform administration</p>
      </section>
    </main>
  )
}
