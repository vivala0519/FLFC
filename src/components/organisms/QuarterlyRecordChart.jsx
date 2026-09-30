import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const SERIES = [
  { key: 'goals', label: '골', color: 'text-rose-600 dark:text-rose-400' },
  { key: 'assists', label: '어시', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'points', label: '승점', color: 'text-emerald-600 dark:text-emerald-400' },
]

const LEFT = 18
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
  const [selectedSeries, setSelectedSeries] = useState(() => new Set())
  const [selectedQuarterKey, setSelectedQuarterKey] = useState(null)
  const [viewportWidth, setViewportWidth] = useState(0)

  const toggleSeries = (key) => {
    setSelectedSeries((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
  const selectedSeriesList = SERIES.filter(({ key }) => selectedSeries.has(key))
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
        <div className="flex flex-wrap gap-x-4 gap-y-1" role="group" aria-label="강조할 그래프 항목">
          {SERIES.map(({ key, label, color }) => (
            <label
              key={key}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-1 py-1 text-xs ${color} focus-within:rounded focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600`}
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
        <div ref={scrollRef} className="w-full overflow-x-auto" role="region" aria-label="분기별 기록 그래프">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label="분기별 골, 어시, 승점 추이. 항목별 최고 분기 대비 백분율"
          >
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
            {quarters.map((quarter, index) => (
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
            {SERIES.map(({ key, color }) => (
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
                      {selectedSeries.has(key) && (
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
