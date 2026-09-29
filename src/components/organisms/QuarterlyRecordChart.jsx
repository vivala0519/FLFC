import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const SERIES = [
  { key: 'goals', label: '골', color: 'text-rose-600 dark:text-rose-400', swatch: 'bg-rose-600 dark:bg-rose-400' },
  { key: 'assists', label: '어시', color: 'text-blue-600 dark:text-blue-400', swatch: 'bg-blue-600 dark:bg-blue-400' },
  { key: 'points', label: '승점', color: 'text-emerald-600 dark:text-emerald-400', swatch: 'bg-emerald-600 dark:bg-emerald-400' },
]

const LEFT = 44
const RIGHT = 18
const TOP = 16
const PLOT_HEIGHT = 176
const BOTTOM = 42
const AXIS_MAX = 100
const TICK_STEP = 25
const displayValue = (value) => value === null ? '기록 없음' : value

const QuarterlyRecordChart = ({ quarters }) => {
  const scrollRef = useRef(null)
  const initialScrollDone = useRef(false)
  const [focusedSeries, setFocusedSeries] = useState(null)
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null)
  const [viewportWidth, setViewportWidth] = useState(0)

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

  if (!quarters?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">분기별 기록이 없습니다.</p>
  }

  const plotWidth = Math.max(220, viewportWidth - LEFT - RIGHT, (quarters.length - 1) * 72)
  const width = LEFT + plotWidth + RIGHT
  const height = TOP + PLOT_HEIGHT + BOTTOM
  const seriesMax = Object.fromEntries(SERIES.map(({ key }) => [
    key, Math.max(0, ...quarters.map((quarter) => quarter[key] ?? 0)),
  ]))
  const plottedValue = (quarter, key) => {
    const value = quarter[key]
    if (value === null) return null
    return seriesMax[key] > 0 ? value / seriesMax[key] * AXIS_MAX : 0
  }
  const xAt = (index) => LEFT + (quarters.length === 1
    ? plotWidth / 2 : index * plotWidth / (quarters.length - 1))
  const yAt = (value) => TOP + PLOT_HEIGHT * (1 - value / AXIS_MAX)
  const selectedQuarter = quarters.find(({ key }) => key === selectedQuarterKey) || quarters[quarters.length - 1]
  const selectedIndex = quarters.indexOf(selectedQuarter)
  const cellWidth = quarters.length === 1 ? plotWidth : plotWidth / (quarters.length - 1)

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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap gap-x-4 gap-y-1" role="group" aria-label="그래프 범례">
          {SERIES.map(({ key, label, color, swatch }) => (
            <button
              key={key}
              type="button"
              aria-pressed={focusedSeries === key}
              onClick={() => setFocusedSeries((current) => current === key ? null : key)}
              className={`inline-flex items-center gap-1.5 border-b-2 px-1 py-1 text-xs ${color} ${focusedSeries === key ? 'border-current font-semibold' : 'border-transparent'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
            >
              <span aria-hidden="true" className={`h-0.5 w-5 ${swatch}`} />
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">항목별 최고 분기 대비</span>
      </div>
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 bg-white dark:bg-gray-900" style={{ width: LEFT, height: TOP + PLOT_HEIGHT + 8 }}>
          {[0, 1, 2, 3, 4].map((tick) => (
            <span key={tick} className="absolute right-2 text-[11px] text-gray-500 dark:text-gray-400" style={{ top: yAt(tick * TICK_STEP) - 7 }}>
              {tick * TICK_STEP}%
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="w-full overflow-x-auto" role="region" aria-label="분기별 기록 그래프">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="분기별 골, 어시, 승점 추이. 항목별 최고 분기 대비 백분율">
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = yAt(tick * TICK_STEP)
              return <line key={tick} x1={LEFT} y1={y} x2={width - RIGHT} y2={y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            })}
            <line x1={xAt(selectedIndex)} y1={TOP} x2={xAt(selectedIndex)} y2={TOP + PLOT_HEIGHT} stroke="currentColor" strokeDasharray="3 4" className="text-gray-400 dark:text-gray-500" />
            {quarters.map((quarter, index) => (
              <text key={quarter.key} x={xAt(index)} y={height - 13} textAnchor="middle" fontSize="11" fill="currentColor" className={quarter.key === selectedQuarter.key ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                {String(quarter.year).slice(-2)}.{quarter.quarter}Q
              </text>
            ))}
            {SERIES.map(({ key, color }) => (
              <g key={key} className={`${color} transition-opacity duration-200`} opacity={focusedSeries && focusedSeries !== key ? 0.16 : 1}>
                <path d={linePath(key)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {quarters.map((quarter, index) => {
                  const value = plottedValue(quarter, key)
                  return value === null ? null : <circle key={quarter.key} cx={xAt(index)} cy={yAt(value)} r="3.5" fill="currentColor" />
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
                  aria-label={`${quarter.label}, 골 ${displayValue(quarter.goals)}, 어시 ${displayValue(quarter.assists)}, 승점 ${displayValue(quarter.points)}`}
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
