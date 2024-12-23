import { useEffect, useState } from 'react'
import VoteDetailHeader from '@/components/organisms/voting/VoteDetailHeader.jsx'
import VoterTap from '@/components/organisms/voting/VoterTap.jsx'

const VoteDetail = (props) => {
  const { statistics, backHandler } = props
  const [tap, setTap] = useState(0)

  // style
  const templateStyle =
    'absolute w-[90%] h-[95%] border-2 border-gray-300 rounded-md flex flex-col items-center justify-center z-10'
  const tapDivStyle =
    'w-full h-10 flex items-center justify-evenly absolute top-16'
  const tapSpanStyle = 'w-1/2 h-full flex items-center justify-center '
  const activeTapStyle = 'border-b-2 border-black'
  const inactiveTapStyle = 'border-b-2 border-gray-200'
  const infoMessageStyle = 'absolute top-32 text-gray-500'
  const contentDivStyle = 'absolute top-36 w-full h-[80%]'

  useEffect(() => {
    console.log(statistics)
  }, [statistics])

  return (
    <div className={templateStyle}>
      <VoteDetailHeader backHandler={backHandler} />
      <div className={tapDivStyle}>
        <span
          className={
            tapSpanStyle + `${tap === 0 ? activeTapStyle : inactiveTapStyle}`
          }
          onClick={() => setTap(0)}
        >
          참여
        </span>
        <span
          className={
            tapSpanStyle + `${tap === 1 ? activeTapStyle : inactiveTapStyle}`
          }
          onClick={() => setTap(1)}
        >
          미참여
        </span>
      </div>
      {tap === 0 && (
        <span className={infoMessageStyle}>투표 시간순으로 표시됩니다</span>
      )}
      <div className={contentDivStyle}>
        {tap === 0 && <VoterTap tap={tap} statistics={statistics} />}
        {tap === 1 && <VoterTap tap={tap} statistics={statistics} />}
      </div>
    </div>
  )
}

export default VoteDetail
