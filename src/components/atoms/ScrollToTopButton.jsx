import { useEffect, useState } from 'react'
import ArrowUpIcon from '@/assets/lucide/arrow-up.svg?react'

const SCROLL_THRESHOLD = 400

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = null
    const updateVisibility = () => {
      frame = null
      setVisible(window.scrollY >= SCROLL_THRESHOLD)
    }
    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])

  if (!visible) return null

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="맨 위로"
      title="맨 위로"
      onClick={scrollToTop}
      className="fixed z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-zinc-700 shadow-md hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus-visible:outline-blue-300"
      style={{
        right: 'calc(1rem + env(safe-area-inset-right, 0px))',
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <ArrowUpIcon aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0" />
    </button>
  )
}

export default ScrollToTopButton
