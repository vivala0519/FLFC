import { useEffect, useId, useRef, useState } from 'react'
import FamilyAppsIcon from '@/assets/family-apps.svg?react'
import CloseIcon from '@/assets/lucide/x.svg?react'
import beTheLegendIcon from '@/assets/fa-be the legend.png'
import whoAmIIcon from '@/assets/fa-who am i.png'
import whatsMyValueIcon from '@/assets/fa-whats my value.png'
import './HeaderFamilyApps.css'

const familyApps = [
  { name: 'Be the Legend', icon: beTheLegendIcon, href: 'https://tossminiapp.com/s/N09oNWBb' },
  { name: 'Who Am I', icon: whoAmIIcon, href: 'https://tossminiapp.com/s/p42d6aeg' },
  { name: "What's My Value", icon: whatsMyValueIcon, href: 'https://tossminiapp.com/s/5aZCfrMp' },
]

const HeaderFamilyApps = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef(null)
  const closeRef = useRef(null)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true
      closeRef.current?.focus({ preventScroll: true })
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  return (
    <div
      className="header-family-apps"
      data-open={isOpen}
      data-refresh-blocked={isOpen ? 'true' : undefined}
      onKeyDown={(event) => {
        if (isOpen && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <div className="flex items-center gap-1" aria-hidden={isOpen} inert={isOpen ? '' : undefined}>
        {children}
        <button
          ref={triggerRef}
          type="button"
          aria-label="패밀리앱"
          title="패밀리앱"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded border-0 bg-transparent p-1 text-gray-900 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-white"
        >
          <FamilyAppsIcon className="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
      <div
        id={panelId}
        role="group"
        aria-labelledby={`${panelId}-title`}
        aria-hidden={!isOpen}
        inert={!isOpen ? '' : undefined}
        className="header-family-apps__panel"
      >
        <span id={`${panelId}-title`} className="header-family-apps__title">패밀리 앱</span>
        {familyApps.map((app) => (
          <a
            key={app.name}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            title={app.name}
            aria-label={`${app.name} 새 창에서 열기`}
            className="header-family-apps__app"
          >
            <img src={app.icon} alt={app.name} width="600" height="600" />
          </a>
        ))}
        <button
          ref={closeRef}
          type="button"
          aria-label="패밀리앱 닫기"
          title="닫기"
          onClick={() => setIsOpen(false)}
          className="header-family-apps__close"
        >
          <CloseIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default HeaderFamilyApps
