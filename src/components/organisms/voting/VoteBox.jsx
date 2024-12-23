import { getDatabase, ref, set } from 'firebase/database'
import { useEffect, useState } from 'react'
import VoteItem from '@/components/molecules/voting/VoteItem.jsx'
import TapTitleText from '@/components/atoms/Text/TapTitleText.jsx'
import RegisterButton from '@/components/atoms/Button/RegisterButton.jsx'
import getTimes from '@/hooks/getTimes.js'

const VoteBox = (props) => {
  const {
    statistics,
    userInfo,
    thisWeekVote,
    nextSunday,
    setDetailTap,
    endVote,
  } = props
  const {
    time: { thisYear },
  } = getTimes()
  const selectType = ['monthAttend', 'weekAttend', 'absent', 'keeping']
  const [titleText, setTitleText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [alreadySelectedIndex, setAlreadySelectedIndex] = useState(-1)
  const [alreadyVote, setAlreadyVote] = useState(false)
  const [editMode, setEditMode] = useState(true)

  const boxStyle =
    'absolute top-20 flex flex-col gap-5 items-center justify-center w-10/12 border-2 border-gray-300 rounded-md pt-5 pb-7'
  const goDetailStyle = 'text-sm text-gray-600'

  useEffect(() => {
    console.log('endVote: ', endVote)
    if (thisWeekVote && userInfo) {
      // 타이틀 설정
      setTitleText(
        Number(nextSunday.slice(0, 2)) +
          '월 ' +
          Number(nextSunday.slice(2, 4)) +
          '일 풋살',
      )
      // 통계 설정
      // calculateStatistics(thisWeekVote)
      // 개인별 설정
      if (thisWeekVote[userInfo.id]) {
        setSelectedIndex(selectType.indexOf(thisWeekVote[userInfo.id]['vote']))
        setAlreadySelectedIndex(
          selectType.indexOf(thisWeekVote[userInfo.id]['vote']),
        )
        setAlreadyVote(true)
        setEditMode(false)
      }
    }
  }, [userInfo, thisWeekVote])

  const registerVoteHandler = async () => {
    if (editMode) {
      if (selectedIndex !== -1) {
        if (alreadySelectedIndex !== selectedIndex) {
          const rtDb = getDatabase()
          const vote = {
            id: userInfo.id,
            name: userInfo['name'],
            vote: selectType[selectedIndex],
            time: new Date().toISOString(),
          }
          await set(
            ref(
              rtDb,
              'vote/' + thisYear + '/' + nextSunday + '/' + userInfo.id,
            ),
            vote,
          )
        }
        setEditMode(false)
      }
    } else {
      setEditMode(true)
    }
  }

  return (
    <div className={boxStyle}>
      <TapTitleText title={titleText} active={true} />
      <VoteItem
        key={selectType[0]}
        index={0}
        text={'월회비 참석'}
        type={'monthAttend'}
        checked={selectedIndex === 0}
        totalItemCount={statistics.monthAttend.length}
        setSelectedIndex={setSelectedIndex}
        editMode={editMode}
        endVote={endVote}
      />
      <VoteItem
        key={selectType[1]}
        index={1}
        text={'주회비 참석'}
        type={'weekAttend'}
        checked={selectedIndex === 1}
        totalItemCount={statistics.weekAttend.length}
        setSelectedIndex={setSelectedIndex}
        editMode={editMode}
        endVote={endVote}
      />
      <VoteItem
        key={selectType[2]}
        index={2}
        text={'불참'}
        type={'absent'}
        checked={selectedIndex === 2}
        totalItemCount={statistics.absent.length}
        setSelectedIndex={setSelectedIndex}
        editMode={editMode}
        endVote={endVote}
      />
      <VoteItem
        key={selectType[3]}
        index={3}
        text={'보류'}
        type={'keeping'}
        checked={selectedIndex === 3}
        totalItemCount={statistics.keeping.length}
        setSelectedIndex={setSelectedIndex}
        editMode={editMode}
        endVote={endVote}
      />
      {!endVote && (
        <RegisterButton
          text={
            editMode ? '투표하기' : alreadyVote ? '다시 투표하기' : '투표하기'
          }
          clickHandler={registerVoteHandler}
          customStyle={''}
          active={selectedIndex !== -1}
        />
      )}
      <div>
        <span className={goDetailStyle} onClick={() => setDetailTap(true)}>
          {statistics.totalVoter.length + '명 참여 >'}
        </span>
      </div>
    </div>
  )
}

export default VoteBox
