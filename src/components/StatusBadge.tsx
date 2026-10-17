export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
    >
      <span
        className={`size-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}
      />
      {status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : status}
    </span>
  )
}
