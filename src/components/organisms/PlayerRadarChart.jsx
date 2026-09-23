import { useId } from 'react'

const center = { x: 160, y: 136 }
const radius = 88
const levels = [0.25, 0.5, 0.75, 1]
const labels = [
  { x: 160, y: 16 },
  { x: 276, y: 101 },
  { x: 232, y: 239 },
  { x: 87, y: 239 },
  { x: 44, y: 101 },
]
const formatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const formatValue = (value, unit) => `${formatter.format(value)}${unit}`
const pointAt = (index, ratio) => {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / 5
  return {
    x: center.x + Math.cos(angle) * radius * ratio,
    y: center.y + Math.sin(angle) * radius * ratio,
  }
}
const polygonPoints = (ratios) => ratios.map((ratio, index) => {
  const point = pointAt(index, ratio)
  return `${point.x},${point.y}`
}).join(' ')

const PlayerRadarChart = ({ name, comparison }) => {
  const id = useId()
  const player = comparison.players.get(name)
  if (!player) {
    return <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">이번 분기 비교할 출석 기록이 없습니다.</p>
  }

  const { axes, players } = comparison
  const playerRatios = axes.map(({ key, max }) => max > 0 ? player[key] / max : 0)
  const averageRatios = axes.map(({ average, max }) => max > 0 ? average / max : 0)

  return (
    <figure className="mb-6" aria-labelledby={`${id}-caption`}>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <span aria-hidden="true" className="h-0 w-5 border-t-2 border-blue-600 dark:border-blue-400" />
          {name}
        </span>
        <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <span aria-hidden="true" className="h-0 w-5 border-t-2 border-dashed border-amber-600 dark:border-amber-400" />
          전체 평균
        </span>
      </div>
      <svg
        viewBox="0 0 320 270"
        className="mx-auto mt-3 block w-full max-w-sm"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{name}의 이번 분기 기록 비교</title>
        <desc id={`${id}-description`}>
          {axes.map(({ key, label, unit, max, average }) =>
            `${label}: ${formatValue(player[key], unit)}, 전체 평균 ${formatValue(average, unit)}, 최고 ${formatValue(max, unit)}`,
          ).join('. ')}
        </desc>
        {levels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(axes.map(() => level))}
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
        ))}
        {axes.map(({ key }, index) => {
          const point = pointAt(index, 1)
          return <line key={key} x1={center.x} y1={center.y} x2={point.x} y2={point.y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
        })}
        <polygon
          points={polygonPoints(averageRatios)}
          fill="currentColor"
          fillOpacity="0.06"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 3"
          className="text-amber-600 dark:text-amber-400"
        />
        <polygon
          points={polygonPoints(playerRatios)}
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          className="text-blue-600 dark:text-blue-400"
        />
        {/*{levels.map((level) => (*/}
        {/*  <text key={level} x={center.x + 5} y={center.y - radius * level + 3} fontSize="9" fill="currentColor" className="text-gray-500 dark:text-gray-400">*/}
        {/*    {level * 100}*/}
        {/*  </text>*/}
        {/*))}*/}
        {axes.map(({ key, label, unit, average, max }, index) => {
          const point = pointAt(index, playerRatios[index])
          const position = labels[index]
          return (
            <g key={key}>
              <circle cx={point.x} cy={point.y} r="3" fill="currentColor" className="text-blue-600 dark:text-blue-400">
                <title>{`${label}: ${formatValue(player[key], unit)} · 평균 ${formatValue(average, unit)} · 최고 ${formatValue(max, unit)}`}</title>
              </circle>
              <text x={position.x} y={position.y} textAnchor="middle" fontSize="13" fill="currentColor" className="font-semibold text-gray-700 dark:text-gray-200">
                {label}
              </text>
              <text x={position.x} y={position.y + 17} textAnchor="middle" fontSize="12" fill="currentColor" className="text-blue-700 dark:text-blue-300">
                {formatValue(player[key], unit)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption id={`${id}-caption`} className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
        이번 분기 출석자 {players.size}명 기준
      </figcaption>
    </figure>
  )
}

export default PlayerRadarChart
