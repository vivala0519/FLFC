import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import MinusIcon from '@/assets/lucide/minus.svg?react'
import PlusIcon from '@/assets/lucide/plus.svg?react'

const SERIES = [
  { key: 'goals', label: '골', color: 'text-rose-600 dark:text-rose-400' },
  { key: 'assists', label: '어시', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'attackPoints', label: '공격포인트', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'points', label: '승점', color: 'text-emerald-600 dark:text-emerald-400' },
]
const GOALKEEPER_SERIES = [
  { ...SERIES[0], key: 'cleanSheets', label: '클린시트' },
  ...SERIES.slice(1),
]

const LEFT = 18
const RIGHT = 18
const TOP = 56
const PLOT_HEIGHT = 176
const BOTTOM = 42
const AXIS_MAX = 100
const TICK_STEP = 25
const MAX_ZOOM = 4
const MIN_LABEL_GAP = 44
const touchDistance = (touches) => Math.hypot(
  touches[0].clientX - touches[1].clientX,
  touches[0].clientY - touches[1].clientY,
)
const displayValue = (value) => value === null || value === undefined ? '기록 없음' : value

const QuarterlyRecordChart = ({ quarters, currentQuarterKey, isGoalkeeper = false }) => {
  const scrollRef = useRef(null)
  const initialScrollDone = useRef(false)
  const pinchRef = useRef(null)
  const zoomRef = useRef(1)
  const pendingScrollRef = useRef(null)
  const suppressTapUntilRef = useRef(0)
  const [selectedSeries, setSelectedSeries] = useState(() => new Set())
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [zoom, setZoom] = useState(1)
  const series = isGoalkeeper ? GOALKEEPER_SERIES : SERIES
  const basePlotWidth = Math.max(220, viewportWidth - LEFT - RIGHT, ((quarters?.length || 1) - 1) * 72)
  const minZoom = Math.min(1, Math.max(1, viewportWidth - LEFT - RIGHT) / basePlotWidth)
  const plotWidth = basePlotWidth * Math.max(minZoom, zoom)

  useEffect(() => {
    const previousKey = isGoalkeeper ? 'goals' : 'cleanSheets'
    const nextKey = isGoalkeeper ? 'cleanSheets' : 'goals'
    setSelectedSeries((current) => current.has(previousKey)
      ? new Set([...current].map((key) => key === previousKey ? nextKey : key)) : current)
  }, [isGoalkeeper])

  const toggleSeries = (key) => {
    setSelectedSeries((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const zoomAt = useCallback((nextZoom, x, ratio) => {
    const viewport = scrollRef.current
    if (!viewport) return
    const next = Math.max(minZoom, Math.min(MAX_ZOOM, nextZoom))
    const nextScroll = LEFT + ratio * basePlotWidth * next - x
    if (next === zoomRef.current) {
      viewport.scrollLeft = nextScroll
      return
    }
    // Restore the focal point after React resizes the SVG.
    pendingScrollRef.current = nextScroll
    zoomRef.current = next
    setZoom(next)
  }, [basePlotWidth, minZoom])

  const zoomAround = useCallback((nextZoom, x) => {
    const viewport = scrollRef.current
    if (!viewport) return
    const center = x ?? viewport.clientWidth / 2
    zoomAt(nextZoom, center, (viewport.scrollLeft + center - LEFT) / (basePlotWidth * zoomRef.current))
  }, [basePlotWidth, zoomAt])

  useLayoutEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return
    const updateWidth = () => setViewportWidth(viewport.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [quarters])

  useEffect(() => {
    if (scrollRef.current && viewportWidth > 0 && !initialScrollDone.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      initialScrollDone.current = true
    }
  }, [quarters, viewportWidth])

  useLayoutEffect(() => {
    if (scrollRef.current && pendingScrollRef.current !== null) {
      scrollRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
    }
  }, [plotWidth])

  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return undefined

    const localX = (clientX) => clientX - viewport.getBoundingClientRect().left
    const startPinch = (event) => {
      if (event.touches.length === 1) suppressTapUntilRef.current = 0
      pinchRef.current = null
      if (event.touches.length !== 2) return
      const distance = touchDistance(event.touches)
      if (distance === 0) return
      if (event.cancelable) event.preventDefault()
      const x = localX((event.touches[0].clientX + event.touches[1].clientX) / 2)
      pinchRef.current = {
        distance,
        zoom: zoomRef.current,
        ratio: (viewport.scrollLeft + x - LEFT) / (basePlotWidth * zoomRef.current),
      }
      suppressTapUntilRef.current = Infinity
    }
    const movePinch = (event) => {
      if (event.touches.length !== 2 || !pinchRef.current) return
      if (event.cancelable) event.preventDefault()
      const { distance, zoom: startZoom, ratio } = pinchRef.current
      const x = localX((event.touches[0].clientX + event.touches[1].clientX) / 2)
      zoomAt(startZoom * touchDistance(event.touches) / distance, x, ratio)
    }
    const endPinch = () => {
      pinchRef.current = null
      if (suppressTapUntilRef.current > 0) suppressTapUntilRef.current = Date.now() + 400
    }
    const wheelZoom = (event) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      zoomAround(zoomRef.current * Math.exp(-event.deltaY * 0.01), localX(event.clientX))
    }
    const keyZoom = (event) => {
      if (!['+', '=', '-', '0'].includes(event.key)) return
      event.preventDefault()
      zoomAround(event.key === '0' ? 1 : zoomRef.current * (event.key === '-' ? 0.8 : 1.25), viewport.clientWidth / 2)
    }
    const clampedZoom = Math.max(minZoom, Math.min(MAX_ZOOM, zoomRef.current))
    zoomRef.current = clampedZoom
    setZoom(clampedZoom)
    viewport.addEventListener('touchstart', startPinch, { passive: false })
    viewport.addEventListener('touchmove', movePinch, { passive: false })
    viewport.addEventListener('touchend', endPinch)
    viewport.addEventListener('touchcancel', endPinch)
    viewport.addEventListener('wheel', wheelZoom, { passive: false })
    viewport.addEventListener('keydown', keyZoom)
    return () => {
      pinchRef.current = null
      viewport.removeEventListener('touchstart', startPinch)
      viewport.removeEventListener('touchmove', movePinch)
      viewport.removeEventListener('touchend', endPinch)
      viewport.removeEventListener('touchcancel', endPinch)
      viewport.removeEventListener('wheel', wheelZoom)
      viewport.removeEventListener('keydown', keyZoom)
    }
  }, [basePlotWidth, minZoom, quarters?.length, zoomAt, zoomAround])

  if (!quarters?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">분기별 기록이 없습니다.</p>
  }

  const width = LEFT + plotWidth + RIGHT
  const height = TOP + PLOT_HEIGHT + BOTTOM
  const seriesMax = Object.fromEntries(series.map(({ key }) => [
    key, Math.max(0, ...quarters.map((quarter) => quarter[key] ?? 0)),
  ]))
  const plottedValue = (quarter, key) => {
    const value = quarter[key]
    if (value === null || value === undefined) return null
    return seriesMax[key] > 0 ? value / seriesMax[key] * AXIS_MAX : 0
  }
  const xAt = (index) => LEFT + (quarters.length === 1
    ? plotWidth / 2 : index * plotWidth / (quarters.length - 1))
  const yAt = (value) => TOP + PLOT_HEIGHT * (1 - value / AXIS_MAX)
  const selectedQuarter = quarters.find(({ key }) => key === selectedQuarterKey) || quarters[quarters.length - 1]
  const selectedIndex = quarters.indexOf(selectedQuarter)
  const currentQuarterIndex = quarters.findIndex(({ key }) => key === currentQuarterKey)
  const cellWidth = quarters.length === 1 ? plotWidth : plotWidth / (quarters.length - 1)
  const labelGap = Math.max(MIN_LABEL_GAP, selectedSeries.size * 24)
  const labelStep = Math.max(1, Math.ceil(labelGap / cellWidth))
  const showQuarterLabel = (index) => {
    if (index === selectedIndex) return true
    if (Math.abs(index - selectedIndex) * cellWidth < labelGap) return false
    if (index === quarters.length - 1) return true
    return (quarters.length - 1 - index) * cellWidth >= labelGap && index % labelStep === 0
  }

  const linePath = (key) => {
    let connected = false
    return quarters.map((quarter, index) => {
      const value = plottedValue(quarter, key)
      if (value === null) {
        connected = false
        return ''
      }
      const segment = `${connected ? 'L' : 'M'} ${xAt(index)} ${yAt(value)}`
      connected = true
      return segment
    }).filter(Boolean).join(' ')
  }
  const selectedSeriesList = series.filter(({ key }) => selectedSeries.has(key))
  const valueLabelX = (key, index) => {
    const seriesIndex = selectedSeriesList.findIndex(({ key: selectedKey }) => selectedKey === key)
    const offset = selectedSeriesList.length > 1
      ? (seriesIndex - (selectedSeriesList.length - 1) / 2) * 16
      : 0
    return Math.max(12, Math.min(width - 12, xAt(index) + offset))
  }

  return (
    <div>
      <div className="mb-3 flex flex-col items-center justify-between gap-x-3 gap-y-1">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:flex-wrap" role="group" aria-label="강조할 그래프 항목">
          {series.map(({ key, label, color }) => (
            <label
              key={key}
              className={`inline-flex cursor-pointer items-center justify-center gap-1.5 px-1 py-1 text-xs ${color} focus-within:rounded focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600`}
            >
              <input
                type="checkbox"
                checked={selectedSeries.has(key)}
                onChange={() => toggleSeries(key)}
                className="h-4 w-4 cursor-pointer accent-current"
              />
              {label}
            </label>
          ))}
        </div>
        <span className="relative top-1 text-[10px] text-gray-500 dark:text-gray-400">체크 시 수치 표시</span>
      </div>
      <div className="relative">
        <div
          className="absolute left-0 top-0 z-10 flex divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:divide-gray-600 dark:border-gray-600 dark:bg-gray-800"
          role="group"
          aria-label="차트 확대 및 축소"
        >
          <button
            type="button"
            aria-label="차트 축소"
            title="축소"
            disabled={viewportWidth === 0 || zoom <= minZoom + 0.000001}
            onClick={() => zoomAround(zoomRef.current * 0.8)}
            className="flex h-11 w-11 items-center justify-center rounded-none border-0 bg-transparent p-0 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <MinusIcon className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false" />
          </button>
          <button
            type="button"
            aria-label="차트 확대"
            title="확대"
            disabled={viewportWidth === 0 || zoom >= MAX_ZOOM - 0.000001}
            onClick={() => zoomAround(zoomRef.current * 1.25)}
            className="flex h-11 w-11 items-center justify-center rounded-none border-0 bg-transparent p-0 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false" />
          </button>
        </div>
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          style={{ touchAction: 'pan-x pan-y' }}
          role="region"
          aria-label="분기별 기록 그래프"
          aria-keyshortcuts="+ - 0"
          tabIndex={0}
          onClickCapture={(event) => {
            if (Date.now() < suppressTapUntilRef.current && event.detail > 0) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label={`분기별 ${series.map(({ label }) => label).join(', ')} 추이. 항목별 최고 분기 대비 백분율`}
          >
            {currentQuarterIndex >= 0 && (
              <text
                x={xAt(currentQuarterIndex)}
                y={TOP - 20}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                className="font-semibold text-gray-500 dark:text-gray-400 animate-bounceUpDown"
              >
                진행중
              </text>
            )}
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = yAt(tick * TICK_STEP)
              return <line key={tick} x1={LEFT} y1={y} x2={width - RIGHT} y2={y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            })}
            <line
              x1={xAt(selectedIndex)}
              y1={TOP}
              x2={xAt(selectedIndex)}
              y2={TOP + PLOT_HEIGHT}
              stroke="currentColor"
              strokeDasharray="3 4"
              className="text-gray-400 dark:text-gray-500"
            />
            {quarters.map((quarter, index) => showQuarterLabel(index) && (
              <text
                key={quarter.key}
                x={xAt(index)}
                y={height - 26}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
                className={
                  quarter.key === selectedQuarter.key ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                }
              >
                <tspan x={xAt(index)} dy="0">{String(quarter.year).slice(-2)}년</tspan>
                <tspan x={xAt(index)} dy="12">{quarter.quarter}분기</tspan>
              </text>
            ))}
            {series.map(({ key, color }) => (
              <g
                key={key}
                className={`${color} transition-opacity duration-200`}
                opacity={selectedSeries.size === 0 || selectedSeries.has(key) ? 1 : 0.16}
              >
                <path d={linePath(key)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {quarters.map((quarter, index) => {
                  const value = plottedValue(quarter, key)
                  if (value === null) return null
                  return (
                    <g key={quarter.key}>
                      <circle cx={xAt(index)} cy={yAt(value)} r="3.5" fill="currentColor" />
                      {selectedSeries.has(key) && showQuarterLabel(index) && (
                        <text x={valueLabelX(key, index)} y={yAt(value) - 7} textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">
                          {quarter[key]}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            ))}
            {quarters.map((quarter, index) => {
              const x = xAt(index)
              const left = index === 0 ? LEFT : x - cellWidth / 2
              const right = index === quarters.length - 1 ? LEFT + plotWidth : x + cellWidth / 2
              const selectQuarter = () => setSelectedQuarterKey(quarter.key)
              return (
                <g
                  key={quarter.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${quarter.label}, ${series.map(({ key, label }) => `${label} ${displayValue(quarter[key])}`).join(', ')}`}
                  onClick={selectQuarter}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectQuarter()
                    }
                  }}
                >
                  <rect x={left} y={TOP} width={right - left} height={PLOT_HEIGHT + 31} fill="transparent" pointerEvents="all" />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      {/*<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums" aria-live="polite">*/}
      {/*  <strong className="font-semibold">{selectedQuarter.label}</strong>*/}
      {/*  {selectedQuarter.attendance === 0 ? (*/}
      {/*    <span className="text-gray-500 dark:text-gray-400">출석 기록 없음</span>*/}
      {/*  ) : SERIES.map(({ key, label }) => (*/}
      {/*    <span key={key}>{label} {displayValue(selectedQuarter[key])}</span>*/}
      {/*  ))}*/}
      {/*</div>*/}
      {/*<table className="sr-only">*/}
      {/*  <caption>분기별 골, 어시, 승점 기록</caption>*/}
      {/*  <thead><tr><th>분기</th><th>골</th><th>어시</th><th>승점</th></tr></thead>*/}
      {/*  <tbody>*/}
      {/*    {quarters.map((quarter) => (*/}
      {/*      <tr key={quarter.key}>*/}
      {/*        <th>{quarter.label}</th>*/}
      {/*        {SERIES.map(({ key }) => <td key={key}>{displayValue(quarter[key])}</td>)}*/}
      {/*      </tr>*/}
      {/*    ))}*/}
      {/*  </tbody>*/}
      {/*</table>*/}
    </div>
  )
}

export default QuarterlyRecordChart
