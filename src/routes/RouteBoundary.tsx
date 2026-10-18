import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'
import PageLoading from '../components/PageLoading'

export default class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-dvh place-items-center bg-canvas p-5">
          <section
            role="alert"
            aria-labelledby="page-error-title"
            className="panel w-full max-w-lg p-7 sm:p-10"
          >
            <h1 id="page-error-title" className="font-display text-2xl font-bold">
              This page could not open
            </h1>
            <p className="my-5 text-sm leading-relaxed text-slate-500">
              Reload to try again, or return to the dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <a className="btn btn-secondary" href="/dashboard">
                Return to dashboard
              </a>
            </div>
          </section>
        </main>
      )
    }

    return <Suspense fallback={<PageLoading />}>{this.props.children}</Suspense>
  }
}
