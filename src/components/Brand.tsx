import { ShieldCheck } from 'lucide-react'
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${light ? 'text-white' : 'text-ink'}`}>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-white/10 text-[#d0e2c5]' : 'bg-sidebar text-[#d0e2c5]'}`}
      >
        <ShieldCheck size={23} strokeWidth={1.7} />
      </span>
      <div>
        <strong className="block font-display text-2xl font-extrabold tracking-[-1px]">
          sarisari<span className="text-[#d3a875]">.</span>
        </strong>
        <span
          className={`block text-[8px] font-semibold uppercase tracking-[.19em] ${light ? 'text-white/40' : 'text-slate-400'}`}
        >
          Platform administration
        </span>
      </div>
    </div>
  )
}
