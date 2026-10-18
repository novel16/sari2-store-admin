import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../../components/Brand'

interface Props {
  title: string
  description: string
  children: ReactNode
}

export default function RecoveryLayout({ title, description, children }: Props) {
  useEffect(() => {
    document.title = `${title} · Sarisari Admin`
  }, [title])
  return (
    <main className="flex min-h-dvh flex-col bg-[#fbfcfa] p-6 sm:p-12">
      <div className="mx-auto w-full max-w-5xl">
        <Brand />
      </div>
      <section className="mx-auto my-auto w-full max-w-sm py-12">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-brand"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
          <ShieldCheck size={13} /> Admin account recovery
        </span>
        <h1 className="font-display text-3xl font-bold tracking-[-1px]">{title}</h1>
        <p className="mb-8 mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
        {children}
        <p className="mt-7 text-center text-[11px] leading-relaxed text-slate-400">
          Keep reset links private. They expire and can only be used once.
        </p>
      </section>
      <p className="text-center text-[10px] text-slate-400">Sarisari platform administration</p>
    </main>
  )
}
