import { useEffect, useState } from 'react'
import VoteDetail from '@/components/templates/VoteDetail.jsx'
import getMembers from '@/hooks/getMembers.js'
import VoteBox from '../organisms/voting/VoteBox.jsx'
import ReplyBox from '../organisms/voting/ReplyBox.jsx'

const VoteTemplate = (props) => {
  const {
    userInfo,
    thisWeekVote,
    thisWeekVoteReply,
    nextSunday,
    endVote,
    setShowDetailTap,
  } = props
  const { existingMembers } = getMembers()
  const [detailTap, setDetailTap] = useState(false)
  const [statistics, setStatistics] = useState({
    totalVoter: [],
    monthAttend: [],
    weekAttend: [],
    absent: [],
    keeping: [],
  })

  // style
  const templateStyle =
    'flex flex-col gap-5 items-center justify-center w-10/12 h-full'

  // 투표 현황 정제
  const calculateStatistics = (obj) => {
    const voteArray = Object.values(obj).filter((vote) => vote !== 'created')
    const nonVoterArr = []

    existingMembers.forEach((member) => {
      let isExist = false
      for (let i = 0; i < voteArray.length; i++) {
        if (member.includes(voteArray[i].nickName)) {
          voteArray[i].name = member
          isExist = true
          break
        }
      }
      if (!isExist) {
        nonVoterArr.push({ name: member })
      }
    })
    const monthAttenders = voteArray
      .filter((vote) => vote['vote'] === 'monthAttend')
      .sort((a, b) => new Date(a.time) - new Date(b.time))
    const weekAttenders = voteArray
      .filter((vote) => vote['vote'] === 'weekAttend')
      .sort((a, b) => new Date(a.time) - new Date(b.time))
    const absentees = voteArray
      .filter((vote) => vote['vote'] === 'absent')
      .sort((a, b) => new Date(a.time) - new Date(b.time))
    const holders = voteArray
      .filter((vote) => vote['vote'] === 'keeping')
      .sort((a, b) => new Date(a.time) - new Date(b.time))
    const nonVoterList = nonVoterArr.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    const copyStatistics = {
      ...statistics,
      totalVoter: voteArray,
      monthAttend: monthAttenders,
      weekAttend: weekAttenders,
      absent: absentees,
      keeping: holders,
      nonVoter: nonVoterList,
    }

    setStatistics(copyStatistics)
  }

  useEffect(() => {
    if (thisWeekVote && userInfo) {
      calculateStatistics(thisWeekVote)
    }
  }, [userInfo, thisWeekVote])

  useEffect(() => {
    setShowDetailTap(detailTap)
  }, [detailTap])

  return (
    <div className={templateStyle}>
      {!detailTap && (
        <VoteBox
          statistics={statistics}
          thisWeekVote={thisWeekVote}
          userInfo={userInfo}
          nextSunday={nextSunday}
          setDetailTap={setDetailTap}
          endVote={endVote}
        />
      )}
      {!detailTap && (
        <ReplyBox
          thisWeekVoteReply={thisWeekVoteReply}
          userInfo={userInfo}
          nextSunday={nextSunday}
          endVote={endVote}
        />
      )}
      {detailTap && (
        <VoteDetail
          statistics={statistics}
          backHandler={() => setDetailTap(false)}
        />
      )}
    </div>
  )
}

export default VoteTemplate
