import { useEffect, useId, useRef, useState } from 'react'
import CloseIcon from '@/assets/lucide/x.svg?react'
import plabFootballLogo from '@/assets/plab-football-logo.png'
import beTheLegendIcon from '@/assets/family-be-the-legend.png'
import whoAmIIcon from '@/assets/family-who-am-i.png'
import whatsMyValueIcon from '@/assets/family-whats-my-value.png'

const familyApps = [
  { name: 'PLAB 풋볼 FLFC 팀 페이지', icon: plabFootballLogo, href: 'https://www.plabfootball.com/team/0810', plab: true },
  { name: 'Who Am I', icon: whoAmIIcon, href: 'https://tossminiapp.com/s/p42d6aeg' },
  { name: "What's My Value", icon: whatsMyValueIcon, href: 'https://tossminiapp.com/s/5aZCfrMp' },
  { name: 'Be the Legend', icon: beTheLegendIcon, href: 'https://tossminiapp.com/s/N09oNWBb' },
]

const focusClass = '!outline-none focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-[-2px] focus-visible:!outline-blue-600 dark:focus-visible:!outline-blue-300'

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
      className="relative w-full"
      data-family-apps-open={isOpen}
      data-refresh-blocked={isOpen ? 'true' : undefined}
      onKeyDown={(event) => {
        if (isOpen && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <div className={`relative w-full ${isOpen ? 'overflow-hidden' : ''}`} aria-hidden={isOpen} inert={isOpen ? '' : undefined}>
        {children}
        <button
          ref={triggerRef}
          type="button"
          aria-label="패밀리 앱 열기"
          title="Family Apps"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(true)}
          className={`absolute bottom-2 right-3 inline-flex h-11 w-11 items-center justify-center rounded border-0 bg-transparent p-0 font-dnf-forged text-xl tracking-wide text-gray-900 hover:opacity-70 dark:text-white ${focusClass}`}
        >
          FA
        </button>
      </div>
      <div className={`absolute inset-0 z-20 overflow-hidden rounded-lg ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          id={panelId}
          role="group"
          aria-labelledby={`${panelId}-title`}
          aria-hidden={!isOpen}
          inert={!isOpen ? '' : undefined}
          className={`grid h-full w-full grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-1 rounded-lg bg-white px-1 text-black transition-transform duration-[240ms] ease-out motion-reduce:transition-none dark:border-slate-700 dark:bg-[#242424] dark:text-blue-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <span
            id={`${panelId}-title`}
            className="shrink-0 justify-self-end whitespace-nowrap font-dnf-forged text-left text-[11px] leading-tight"
          >
            패밀리 앱
          </span>
          <div className="grid grid-cols-[repeat(4,2.75rem)] items-center justify-self-end gap-0 [@media(min-width:380px)]:gap-3">
            {familyApps.map((app) => (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                title={app.name}
                aria-label={`${app.name} 새 창에서 열기`}
                className={`flex h-11 min-w-0 items-center justify-center rounded-md hover:opacity-75 ${focusClass}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${app.plab ? 'border border-black' : ''}`}>
                  <img
                    src={app.icon}
                    alt={app.name}
                    className={app.plab ? 'h-7 w-7 object-contain dark:brightness-0 dark:invert' : 'h-full w-full rounded-md object-cover'}
                  />
                </span>
              </a>
            ))}
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="패밀리 앱 닫기"
            title="닫기"
            onClick={() => setIsOpen(false)}
            className={`flex h-11 w-11 items-center justify-center rounded-md border-0 bg-transparent p-0 text-slate-700 hover:opacity-70 dark:text-slate-200 ${focusClass}`}
          >
            <CloseIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeaderFamilyApps
