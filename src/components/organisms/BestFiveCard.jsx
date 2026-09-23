import ground from '@/assets/ground4.png'
import leftFoot from '@/assets/left_foot.png'
import rightFoot from '@/assets/right_foot.png'

const positionsOnField = [
  { key: 'pivo', className: 'left-1/2 top-[35px] -translate-x-1/2' },
  { key: 'rightAla', className: 'right-[25px] top-[70px]' },
  { key: 'leftAla', className: 'left-[25px] top-[70px]' },
  { key: 'fixo', className: 'bottom-[75px] left-1/2 -translate-x-1/2' },
  { key: 'goleiro', className: 'bottom-[30px] left-1/2 -translate-x-1/2' },
]

const positionStats = [
  { key: 'pivo', label: 'ST' },
  { key: 'leftAla', label: 'LM' },
  { key: 'rightAla', label: 'RM' },
  { key: 'fixo', label: 'DF' },
  { key: 'goleiro', label: 'GK' },
]

const cardFrameClass = 'relative h-[200px] shrink-0 p-1 text-left'

const BestFiveCard = ({ positions }) => (
    <div className="flex w-full gap-4 overflow-x-auto pb-4 desktop:justify-center">
      <figure className={cardFrameClass}>
        <div className="relative flex h-full w-full flex-col justify-center gap-3 overflow-hidden rounded-md">
          {positionStats.map(({key, label}) => {
            const player = positions[key]
            return (
                <span key={key} className="relative z-10 flex items-baseline gap-2 whitespace-nowrap text-sm font-bold">
              <span className="w-6 shrink-0">{label}</span>
              <span className="min-w-0 flex-1 truncate text-blueSignature dark:text-yellow-400">{player?.name || '-'}</span>
                  {player && (
                      <span className="text-xs">
                  {key === 'pivo' ? `${player.골}골`
                      : key === 'leftAla' || key === 'rightAla' ? `${player.어시}어시`
                          : `${player.승점률.toFixed(2)}점`}
                </span>
                  )}
            </span>
            )
          })}
        </div>
      </figure>


      <figure className={cardFrameClass + ' w-[180px]'}>
        <div
            className="relative h-full w-full overflow-hidden rounded-md bg-[length:100%_100%]"
            style={{backgroundImage: `url(${ground})`}}
        >
          {positionsOnField.map(({key, className}) => {
            const player = positions[key]
            const footImage = player?.preferredFoot === 'R' ? rightFoot : player?.preferredFoot === 'L' ? leftFoot : null
            return (
                <span key={key}
                      className={`absolute animate-pulse whitespace-nowrap text-sm font-bold text-white drop-shadow-md ${className}`}>
              {player?.name || '-'}
                  {footImage &&
                      <img src={footImage} alt="" className="absolute -right-4 -top-4 h-6 w-6 -rotate-[20deg]"/>}
            </span>
            )
          })}
        </div>
      </figure>
    </div>
)

export default BestFiveCard
