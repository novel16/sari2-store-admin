import { useEffect, useRef, useState } from 'react'

export function useDrawer() {
  const [open, setOpen] = useState(false),
    ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)'),
      resize = () => {
        if (media.matches) setOpen(false)
      }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? [],
      ).filter((item) => item.getBoundingClientRect().width > 0)
    focusable()[0]?.focus({ preventScroll: true })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Tab') {
        const items = focusable(),
          first = items[0],
          last = items.at(-1)
        if (!ref.current?.contains(document.activeElement)) {
          event.preventDefault()
          first?.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', keydown)
      previous?.focus({ preventScroll: true })
    }
  }, [open])
  return { open, setOpen, ref }
}
