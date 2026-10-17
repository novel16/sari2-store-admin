import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import AdminHeader from './AdminHeader'
import { useDrawer } from './useDrawer'

export default function AdminLayout() {
  const { open, setOpen, ref: sidebarRef } = useDrawer(),
    { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const label = pathname.startsWith('/accounts')
      ? 'Accounts'
      : pathname.startsWith('/stores')
        ? 'Stores'
        : pathname.startsWith('/plans')
          ? 'Plans'
          : 'Overview'
    document.title = `${label} · Sarisari Admin`
  }, [pathname])
  return (
    <div className="min-h-dvh bg-canvas">
      {open && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation overlay"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="admin-sidebar"
        ref={sidebarRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col overflow-y-auto bg-sidebar transition-transform duration-200 lg:visible lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        <Sidebar close={() => setOpen(false)} />
      </aside>
      <div className="lg:ml-[252px]">
        <AdminHeader open={open} onOpen={() => setOpen(true)} />
        <main className="mx-auto max-w-[1600px] p-5 pt-7 sm:p-8 xl:p-10">
          <Outlet />
        </main>
        <footer className="mx-5 mt-6 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-5 text-[10px] text-slate-400 sm:mx-8 xl:mx-10">
          <span>Sarisari · A little clarity for every store.</span>
          <span>Platform administration</span>
        </footer>
      </div>
    </div>
  )
}
