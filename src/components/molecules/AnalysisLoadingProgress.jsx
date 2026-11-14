import { useEffect, useLayoutEffect, useState } from 'react'

const AnalysisLoadingProgress = ({ tasks, onVisibilityChange }) => {
  const total = tasks.length
  const completed = tasks.filter((task) => task.ready && !task.error).length
  const failedTask = tasks.find((task) => task.error)
  const complete = completed === total && !failedTask
  const percentage = total === 0 ? 0 : Math.floor(completed * 100 / total)
  const [visible, setVisible] = useState(!complete)

  useEffect(() => {
    if (!complete) {
      setVisible(true)
      return undefined
    }
    const timer = window.setTimeout(() => setVisible(false), 600)
    return () => window.clearTimeout(timer)
  }, [complete])

  const isVisible = total > 0 && (!complete || visible)
  useLayoutEffect(() => {
    onVisibilityChange?.(isVisible)
  }, [isVisible, onVisibilityChange])

  if (!isVisible) return null

  const pendingTask = tasks.find((task) => !task.ready)
  const message = failedTask ? '일부 데이터를 불러오지 못했습니다.'
    : complete ? '데이터 준비 완료' : '데이터 준비 중'

  return (
    <div className="mb-4 border-b border-gray-200 pb-3 text-left dark:border-gray-700">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <p role={failedTask ? 'alert' : 'status'} className={failedTask ? 'text-red-600 dark:text-red-300' : 'text-zinc-700 dark:text-zinc-200'}>{message}</p>
        <span className="shrink-0 font-semibold tabular-nums text-zinc-700 dark:text-zinc-200" aria-hidden="true">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="분석 데이터 준비 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={`${total}개 중 ${completed}개 준비됨`}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div
          className={`h-full transition-[width] duration-300 motion-reduce:transition-none ${failedTask ? 'bg-red-500' : complete ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-zinc-700 dark:bg-zinc-200'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 min-h-4 break-keep text-xs text-gray-500 dark:text-gray-400">
        {failedTask ? `${failedTask.label} · 새로고침 후 다시 확인해 주세요.` : complete ? '모든 기록이 준비됐습니다.' : pendingTask?.label}
      </p>
    </div>
  )
}

export default AnalysisLoadingProgress
