import { useRef } from 'react'
import usePullToRefresh from '@/hooks/usePullToRefresh.js'
import './HeaderPullToRefresh.css'

const canRefresh = () => !document.querySelector('[data-refresh-blocked="true"], dialog[open], .swal2-container')

const HeaderPullToRefresh = ({ children, onRefresh }) => {
  const areaRef = useRef(null)
  const { distance, isPulling, isReady, isRefreshing } = usePullToRefresh(areaRef, { onRefresh, canRefresh })
  const state = isRefreshing ? 'refreshing' : isPulling ? isReady ? 'ready' : 'pulling' : 'idle'

  return (
    <div
      ref={areaRef}
      className="header-refresh-area relative w-full shrink-0"
      data-pull-state={state}
      style={{ paddingTop: distance }}
    >
      <div
        className={`header-refresh-indicator text-xs font-semibold ${isReady ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
        role="status"
        aria-live="polite"
        aria-hidden={distance === 0}
        style={{ height: Math.min(distance, 44), opacity: Math.min(distance / 32, 1) }}
      >
        {isRefreshing ? '새로고침 중...' : '새로고침하기'}
      </div>
      {children}
    </div>
  )
}

export default HeaderPullToRefresh
