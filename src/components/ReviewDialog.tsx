import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function ReviewDialog({
  title,
  children,
  onClose,
  dismissible = true,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  dismissible?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null),
    heading = useId()
  useEffect(() => {
    const dialog = ref.current,
      overflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = overflow
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={heading}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-ink shadow-2xl backdrop:bg-slate-950/45 sm:p-7"
      onCancel={(event) => {
        event.preventDefault()
        if (dismissible) onClose()
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={heading} className="font-display text-lg font-bold">
          {title}
        </h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Close review"
          disabled={!dismissible}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
