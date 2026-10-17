import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Brand />
      <div className="panel flex max-w-md flex-col items-center p-8 sm:p-12">
        <Compass size={32} className="mb-6 text-brand" />
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">This page is missing</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          The address may have changed. Head back to your platform overview to continue.
        </p>
        <Link to="/dashboard" className="btn btn-primary mt-7">
          <ArrowLeft size={16} />
          Back to overview
        </Link>
      </div>
    </main>
  )
}
