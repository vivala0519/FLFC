import { useState } from 'react'

import ground from '@/assets/ground3.webp'
import laurel from '@/assets/laurel.png'
import leftFoot from '@/assets/left_foot.png'
import rightFoot from '@/assets/right_foot.png'

const positionsOnField = [
  { key: 'pivo', className: 'left-1/2 top-[95px] -translate-x-1/2' },
  { key: 'leftAla', className: 'left-[155px] top-[145px]' },
  { key: 'rightAla', className: 'right-[155px] top-[145px]' },
  { key: 'fixo', className: 'bottom-[135px] left-1/2 -translate-x-1/2' },
  { key: 'goleiro', className: 'bottom-[87px] left-1/2 -translate-x-1/2' },
]

const positionStats = [
  { key: 'pivo', label: 'ST' },
  { key: 'leftAla', label: 'LM' },
  { key: 'rightAla', label: 'RM' },
  { key: 'fixo', label: 'DF' },
  { key: 'goleiro', label: 'GK' },
]

const BestFiveCard = ({ positions }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <button
      type="button"
      className="relative block h-[350px] w-[250px] rounded-lg bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-1 text-left shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
      style={{ perspective: '1000px' }}
      aria-label={isFlipped ? 'BEST Ⅴ 카드 기록 면. 눌러서 경기장 보기' : 'BEST Ⅴ 카드 경기장 면. 눌러서 기록 보기'}
      onClick={() => setIsFlipped((flipped) => !flipped)}
    >
      <span
        className="relative block h-full w-full transition-transform duration-500"
        style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)`, transformStyle: 'preserve-3d' }}
      >
        <span
          className="absolute inset-0 block overflow-hidden rounded-md bg-[length:100%_100%] bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${ground})`, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          aria-hidden={isFlipped}
        >
          {positionsOnField.map(({ key, className }) => {
            const player = positions[key]
            const footImage = player?.preferredFoot === 'R' ? rightFoot : player?.preferredFoot === 'L' ? leftFoot : null
            return (
              <span key={key} className={`absolute animate-pulse whitespace-nowrap text-sm font-bold text-yellow-400 underline decoration-2 decoration-red-600 drop-shadow-md ${className}`}>
                {player?.name || '-'}
                {footImage && <img src={footImage} alt="" className="absolute -right-4 -top-4 h-6 w-6 -rotate-[20deg]" />}
              </span>
            )
          })}
          <span className="pointer-events-none absolute -left-20 -top-24 h-[170%] w-1/3 rotate-45 animate-shineEffect bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </span>

        <span
          className="absolute inset-0 flex flex-col justify-center gap-3 overflow-hidden rounded-md bg-black px-4 text-white"
          style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          aria-hidden={!isFlipped}
        >
          <img src={laurel} alt="" className="pointer-events-none absolute inset-0 m-auto h-[220px] w-[220px] object-contain opacity-20" />
          {positionStats.map(({ key, label }) => {
            const player = positions[key]
            return (
              <span key={key} className="relative z-10 flex items-baseline gap-2 whitespace-nowrap text-sm font-bold">
                <span className="w-6 shrink-0">{label}</span>
                <span className="min-w-0 flex-1 truncate text-yellow-400">{player?.name || '-'}</span>
                {player && (
                  <span className="text-xs">
                    {key === 'goleiro' ? `${player.승점}승점` : `${player.골}골 ${player.어시}어시`}
                  </span>
                )}
              </span>
            )
          })}
        </span>
      </span>
    </button>
  )
}

export default BestFiveCard
