import React, { useEffect, useState } from 'react'

const TitleHolderCard = (props) => {
  const { tapNumber, data } = props
  const [isFlipped, setIsFlipped] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [gridStyle, setGridStyle] = useState(false)

  const tapImage = [
    'rodrigo',
    'palmer',
    'salah',
    'earlyStarter',
    'slowStarter',
    'sonKaeDuo',
    'ronaldo',
    'DeBruyne',
    'myTeam',
    'CJamChul',
  ]
  const tapTitleList = [
    '최다 MVP',
    '텐-텐 클럽',
    '트웬티-트웬티 클럽',
    'Best 얼리 스타터',
    'Best 슬로우 스타터',
    '손케 듀오',
    '내가!',
    '너가!',
    '친해지길 바라',
    '인맥왕',
  ]
  const tapDescriptionList = [
    '데일리 MVP 최다 플레이어',
    '골,어시 10개 이상 달성 플레이어',
    '골,어시 20개 이상 달성 플레이어',
    '전반 포인트 비율이 높은 플레이어',
    '후반 포인트 비율이 높은 플레이어',
    '합작 골이 가장 많은 듀오',
    '골 비율이 가장 높은 플레이어',
    '어시 비율이 가장 높은 플레이어',
    '최다 같은 팀 듀오',
    '용병 최다 호출 플레이어',
  ]

  const cardStyle = 'flex justify-center items-center bg-gray-100 '
  const raurelImage =
    'after:content-[""] after:absolute after:bg-laurel after:bg-center after:bg-no-repeat after:bg-cover after:w-[100%] after:h-[62%] after:top-[42%] after:opacity-15 after:z-0 before:content-[""] before:absolute before:bg-laurel before:bg-center before:bg-no-repeat before:rotate-[180deg] before:bg-cover before:w-[100%] before:h-[62%] before:-top-[3%] before:opacity-15 before:z-0'

  const handleCardClick = () => {
    setFlipping(true)
    setTimeout(() => {
      setFlipping(false)
      setIsFlipped(!isFlipped)
    }, 500)
  }

  useEffect(() => {
    setGridStyle(tapNumber > 0 && tapNumber < 3 && data?.name?.length > 1)
  }, [data, tapNumber])

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col gap-1">
        <span className="text-xl font-kbo text-yellow-500">
          {tapTitleList[tapNumber]}
        </span>
      </div>
      <div className={cardStyle}>
        <div
          className={`relative w-[250px] h-[350px] rounded-lg overflow-hidden p-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 transition-transform duration-700 ${
            flipping ? 'animate-spinVertical' : ''
          }`}
          onClick={handleCardClick}
        >
          {/* 카드 앞면 */}
          <div
            className={`absolute w-[242px] h-[342px] bg-${tapImage[tapNumber]} bg-[length:100%_100%] rounded-lg backface-hidden ${
              isFlipped ? 'hidden' : ''
            }`}
          ></div>

          {/* 카드 뒷면 */}
          <div
            className={`absolute flex justify-center items-center gap-[5px] w-[242px] h-[342px] bg-black rounded-lg text-white text-xl font-bold backface-hidden transform rotate-y-180 ${raurelImage} ${
              isFlipped ? '' : 'hidden'
            }`}
          >
            <div
              className={`h-2/3 w-2/3 ${gridStyle ? 'grid grid-cols-2 overflow-auto' : 'flex flex-col'} items-center justify-center`}
            >
              {data?.name?.map((player) => (
                <span key={player} className="text-yellow-500">
                  {player}
                </span>
              ))}
              {!data['name'] && <span className="text-yellow-500">공석</span>}
            </div>
          </div>
          {/* 광택 효과 */}
          <div
            className={`absolute top-0 left-0 w-[65%] h-[250%] bg-gradient-to-r from-white/40 to-white/10 rotate-45 animate-shineEffect ${flipping ? 'rotate-[45deg]' : ''}`}
          ></div>
        </div>
      </div>
      <span>{tapDescriptionList[tapNumber]}</span>
      {data.count && <span>{data.count}</span>}
      {data.additional?.length > 0 && (
        <span className="animate-bounceUpDown text-red-600 mt-2">
          달성 임박
        </span>
      )}
      <div
        className={`${data.additional?.length > 1 && 'grid grid-cols-3 items-center justify-center w-[80%]'}`}
      >
        {data.additional?.map((player) => (
          <span key={player} className="relative z-1 text-lg text-gray-400">
            {player}
          </span>
        ))}
      </div>
    </div>
  )
}

export default TitleHolderCard
