import { LoaderCircle } from 'lucide-react'
export default function PageLoading() {
  return (
    <main role="status" className="grid min-h-dvh place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <LoaderCircle size={20} className="animate-spin" />
        Loading your admin workspace…
      </div>
    </main>
  )
}
