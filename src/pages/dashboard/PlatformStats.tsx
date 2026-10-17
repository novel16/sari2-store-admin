import { Building2, ShieldCheck, Store, Users } from 'lucide-react'
import type { Overview } from '../../platform/types'
import { number } from '../../platform/format'

const cards = [
  { key: 'accounts', label: 'Accounts', icon: Building2, color: 'bg-[#eaf1ed] text-brand' },
  { key: 'stores', label: 'Stores', icon: Store, color: 'bg-[#f8efdf] text-[#a27a34]' },
  { key: 'users', label: 'Users', icon: Users, color: 'bg-[#ebeff9] text-[#6274aa]' },
  {
    key: 'administrators',
    label: 'Administrators',
    icon: ShieldCheck,
    color: 'bg-[#f1ecf5] text-[#8a6d9f]',
  },
] as const

export default function PlatformStats({ summary }: Pick<Overview, 'summary'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color }) => {
        const counts = summary[key]
        return (
          <section key={key} className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-slate-500">{label}</h2>
              <span className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={19} strokeWidth={1.7} />
              </span>
            </div>
            <p className="mt-2 font-display text-[34px] font-bold tracking-tight">
              {number(counts.total)}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[10px]">
              <span className="text-brand">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-brand/60" />
                {number(counts.active)} active
              </span>
              <span className="text-slate-400">{number(counts.suspended)} suspended</span>
            </div>
          </section>
        )
      })}
    </div>
  )
}
