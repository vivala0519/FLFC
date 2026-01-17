import React, { useEffect, useState } from 'react'

const TitleHolderCard = (props) => {
  const { tapNumber, data, membersInfo } = props
  const [isFlipped, setIsFlipped] = useState(tapNumber === 0 ? true : false)
  const [flipping, setFlipping] = useState(false)
  const [gridStyle, setGridStyle] = useState(false)

  const tapImage = [
    'ground',
    'rodrigo',
    'palmer',
    'salah',
    'earlyStarter',
    'slowStarter',
    'sonKaeDuo',
    'ronaldo',
    'DeBruyne',
    'myTeam',
  ]
  const tapTitleList = [
    'BEST Ⅵ',
    '최다 MVP',
    '텐-텐 클럽',
    '트웬티-트웬티 클럽',
    'Best 얼리 스타터',
    'Best 슬로우 스타터',
    '손케 듀오',
  ]
  const tapDescriptionList = [
    '승점 기반 Best 6',
    '데일리 MVP 최다 플레이어',
    '골 & 어시 10개 이상 달성 플레이어',
    '골 & 어시 20개 이상 달성 플레이어',
    '전반에 포인트 비율이 높은 플레이어',
    '후반에 포인트 비율이 높은 플레이어',
    '합작 골이 가장 많은 듀오',
  ]

  const cardStyle = 'flex justify-center items-center bg-gray-100 '
  const raurelImage = 'after:content-[""] after:absolute after:bg-laurel after:bg-center after:bg-no-repeat after:bg-cover after:w-[100%] after:h-[62%] after:top-[42%] after:opacity-15 after:z-0 before:content-[""] before:absolute before:bg-laurel before:bg-center before:bg-no-repeat before:rotate-[180deg] before:bg-cover before:w-[100%] before:h-[62%] before:-top-[3%] before:opacity-15 before:z-0'
  const rightFootImageStyle = 'absolute right-[-5px] bottom-4 transform rotate-[-20deg] bg-rightFoot bg-[length:100%_100%] w-[30px] h-[30px]'
  const leftFootImageStyle = 'absolute left-[-5px] bottom-4 transform rotate-[20deg] bg-leftFoot bg-[length:100%_100%] w-[30px] h-[30px]'

  const handleCardClick = () => {
    setFlipping(true)
    setTimeout(() => {
      setFlipping(false)
      setIsFlipped(!isFlipped)
    }, 500)
  }

  useEffect(() => {
    setGridStyle(tapNumber > 0 && tapNumber < 3 && data?.name?.length > 1)
    if (data?.name?.length > 0) {
      setTimeout(() => {
        setFlipping(true)
        setTimeout(() => {
          setFlipping(false)
          setIsFlipped(!isFlipped)
        }, 500)
      }, 200)
      return
    }
    if (tapNumber === 0) {
      setTimeout(() => {
        setFlipping(true)
        setTimeout(() => {
          setFlipping(false)
          setIsFlipped(!isFlipped)
        }, 500)
      }, 200)
    }
  }, [data, tapNumber])

  return (
    <div className="flex flex-col items-center gap-[20px]">
      <div className="flex flex-col gap-1">
        <span className="text-xl font-kbo text-goal">{tapTitleList[tapNumber]}</span>
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
          >
            {tapNumber === 0 && (
              <div className="absolute inset-0 z-10">
                {/* pivo: 상단 중앙 */}
                <div className="absolute top-[95px] left-1/2 -translate-x-1/2 text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.pivo.name}</span>
                  {membersInfo && membersInfo[data?.pivo.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>

                {/* leftAla: 왼쪽 중앙 */}
                <div className="absolute top-[145px] left-[155px] text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.leftAla.name}</span>
                  {membersInfo && membersInfo[data?.leftAla.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>

                {/* rightAla: 오른쪽 중앙 */}
                <div className="absolute top-[145px] right-[155px] text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.rightAla.name}</span>
                  {membersInfo && membersInfo[data?.rightAla.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>

                {/* fixo: goleiro보다 살짝 위(하단 중앙) */}
                <div className="absolute bottom-[135px] left-1/2 -translate-x-1/2 text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.fixo.name}</span>
                  {membersInfo && membersInfo[data?.fixo.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>

                {/* goleiro: 하단 중앙 */}
                <div className="absolute bottom-[87px] left-1/2 -translate-x-1/2 text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.goleiro.name}</span>
                  {membersInfo && membersInfo[data?.goleiro.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>

                {/* cheerCaptin: 하단 우측 중앙 */}
                <div className="absolute bottom-[70px] right-[0] -translate-x-1/2 text-yellow-400 font-bold animate-pulse underline decoration-2 decoration-solid decoration-red-600">
                  <span>{data?.cheerCaptin.name}</span>
                  {membersInfo && membersInfo[data?.cheerCaptin.name]['preferredFoot'] === 'R' ? (
                    <div className={rightFootImageStyle}></div>
                  ) : (
                    <div className={leftFootImageStyle}></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 카드 뒷면 */}
          <div className={`absolute flex justify-center items-center gap-[5px] w-[242px] h-[342px] bg-black rounded-lg text-white text-xl font-bold backface-hidden transform rotate-y-180 ${raurelImage} ${isFlipped ? '' : 'hidden'}`}>
            <div className={`h-2/3 w-2/3 ${gridStyle ? 'grid grid-cols-2 overflow-auto' : 'flex flex-col'} items-center justify-center`}>
              {data?.name?.map((player) => (
                <span key={player} className="text-yellow-500">
                  {player}
                </span>
              ))}
              {tapNumber !== 0 && !data?.name && <span className="text-yellow-500">공석</span>}
              {/* best 6 */}
              {tapNumber === 0 && (
                <div className={'flex flex-col gap-1'}>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>ST</span>
                    <span className={'text-yellow-500'}>{data?.pivo?.name}</span>
                    <span className={'text-sm'}>{data?.pivo?.골 + '골 ' + data?.pivo?.어시 + '어시'}</span>
                  </div>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>LM</span>
                    <span className={'text-yellow-500'}>{data?.leftAla?.name}</span>
                    <span className={'text-sm'}>{data?.leftAla?.골 + '골 ' + data?.leftAla?.어시 + '어시'}</span>
                  </div>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>RM</span>
                    <span className={'text-yellow-500'}>{data?.rightAla?.name}</span>
                    <span className={'text-sm'}>{data?.rightAla?.골 + '골 ' + data?.rightAla?.어시 + '어시'}</span>
                  </div>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>DF</span>
                    <span className={'text-yellow-500'}>{data?.fixo?.name}</span>
                    <span className={'text-sm'}>{data?.fixo?.골 + '골 ' + data?.fixo?.어시 + '어시'}</span>
                  </div>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>GK</span>
                    <span className={'text-yellow-500'}>{data?.goleiro?.name}</span>
                    <span className={'text-sm'}>{data?.goleiro?.승점 + '승점'}</span>
                  </div>
                  <div className={'flex items-center gap-2'}>
                    <span className={'text-sm'}>S</span>
                    <span className={'text-yellow-500'}>{data?.cheerCaptin?.name}</span>
                    <span className={'text-sm'}>{data?.cheerCaptin?.승점 + '승점'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* 광택 효과 */}
          <div
            className={`absolute top-0 left-0 w-[65%] h-[250%] bg-gradient-to-r from-white/40 to-white/10 rotate-45 animate-shineEffect ${flipping ? 'rotate-[45deg]' : ''}`}
          ></div>
        </div>
      </div>
      <div className={'flex flex-col gap-1'}>
        <span>{tapDescriptionList[tapNumber]}</span>
        {data?.count && <span>{data?.count}</span>}
        {data?.additional?.length > 0 && <span className="animate-bounceUpDown text-red-600 mt-2">달성 임박</span>}
        <div className={`${data?.additional?.length > 1 && 'grid grid-cols-3 items-center justify-center w-[80%]'}`}>
          {data?.additional?.map((player) => (
            <span key={player} className="relative z-1 text-lg text-gray-400">
              {player}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TitleHolderCard