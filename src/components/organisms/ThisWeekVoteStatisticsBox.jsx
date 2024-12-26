import { useEffect, useState } from 'react'
import getVotes from '@/hooks/getVotes.js'
import getMembers from '@/hooks/getMembers.js'
import Separator from '../atoms/Separator.jsx'

const ThisWeekVoteStatisticsBox = (props) => {
  const { nextSunday } = props
  const { voteList } = getVotes()
  const { existingMembers } = getMembers()
  const [voteStatistics, setVoteStatistice] = useState({
    monthAttend: [],
    weekAttend: [],
  })
  const [attenders, setAttenders] = useState([])
  const [replies, setReplies] = useState([])

  // style
  const boxStyle = 'flex flex-col mb-8 items-center'
  const boxBorderStyle =
    'flex flex-col items-center border-2 border-green-600 rounded-md w-[80%] p-3'
  const playerNameStyle =
    'text-sm underline decoration-2 decoration-solid decoration-yellow-400'

  useEffect(() => {
    if (voteList[nextSunday]) {
      const latestEntries = new Map()
      console.log(voteList[nextSunday])
      console.log(voteList[nextSunday + '_reply'])
      // 투표 내용 정제
      const voteObj = voteList[nextSunday]
      const voteReplyObj = voteList[nextSunday + '_reply']
      let voteArray = Object.values(voteObj)
      let voteReplyArray = null
      if (voteReplyObj) {
        voteReplyArray = Object.values(voteReplyObj)
        voteReplyArray = voteReplyArray.concat([
          //   {
          //     id: '113',
          //     name: '윤영진',
          //     time: '2024-08-07T05:43:37.476Z',
          //     type: 0,
          //     content: '참석으로 변경',
          //   },
          //   {
          //     id: '114',
          //     name: '손지원',
          //     time: '2024-08-06T05:43:37.476Z',
          //     type: 0,
          //     content: '참석으로 변경',
          //   },
          {
            id: '111',
            name: '방승진',
            time: '2024-08-10T05:43:37.476Z',
            type: 2,
            content: '키퍼로 참여',
          },
          {
            id: '111',
            name: '홍원진',
            time: '2024-08-10T05:44:37.476Z',
            type: 2,
            content: '키퍼로 참여',
          },
          // {
          //   id: '112',
          //   name: '원진',
          //   time: '2024-08-08T05:43:37.476Z',
          //   type: 1,
          //   content: '불참으로 변경',
          // },
        ])
        const attendType = voteReplyArray.filter((reply) => reply.type < 2)
        const otherType = voteReplyArray.filter((reply) => reply.type > 1)
        attendType.forEach((entry) => {
          latestEntries.set(entry.name, entry)
        })

        voteReplyArray = Array.from(latestEntries.values())
          .concat(otherType)
          .sort((a, b) => new Date(a.time) - new Date(b.time))

        // voteReplyArray = Array.from(latestEntries.values()).sort((a, b) => new Date(a.time) - new Date(b.time))

        console.log(voteReplyArray)
      }

      voteArray = voteArray.concat([
        {
          id: '210',
          nickName: '원효',
          name: '이원효',
          vote: 'monthAttend',
          time: '2024-07-30T12:00:00.000Z',
        },
        {
          id: '210',
          nickName: '희철',
          name: '윤희철',
          vote: 'monthAttend',
          time: '2024-07-31T12:13:00.000Z',
        },
        {
          id: '210',
          nickName: '희재',
          name: '임희재',
          vote: 'monthAttend',
          time: '2024-08-01T17:14:00.000Z',
        },
        {
          id: '210',
          nickName: '우진',
          name: '정우진',
          vote: 'monthAttend',
          time: '2024-08-02T12:20:00.000Z',
        },
        // {id: '210', nickName: '장용', vote: 'monthAttend', time: '2024-07-30T12:21:00.000Z'},
        // {id: '210', nickName: '성민', vote: 'monthAttend', time: '2024-07-30T12:22:00.000Z'},
        {
          id: '210',
          nickName: '상태',
          name: '한상태',
          vote: 'monthAttend',
          time: '2024-08-03T15:32:00.000Z',
        },
        {
          id: '210',
          nickName: '장식',
          name: '우장식',
          vote: 'monthAttend',
          time: '2024-08-04T12:19:00.000Z',
        },
        {
          id: '210',
          nickName: '성민',
          name: '장성민',
          vote: 'monthAttend',
          time: '2024-08-05T12:11:00.000Z',
        },
        {
          id: '210',
          nickName: '영진',
          name: '윤영진',
          vote: 'monthAttend',
          time: '2024-08-06T12:16:00.000Z',
        },
        // {id: '210', nickName: '준휘', vote: 'weekAttend', time: '2024-07-30T12:24:00.000Z'},
        {
          id: '210',
          nickName: '동휘',
          name: '김동휘',
          vote: 'monthAttend',
          time: '2024-08-08T12:28:00.000Z',
        },
        // {id: '210', nickName: '대건', vote: 'weekAttend', time: '2024-07-30T12:17:00.000Z'},
        {
          id: '210',
          nickName: '승진',
          name: '방승진',
          vote: 'monthAttend',
          time: '2024-08-09T12:18:00.000Z',
        },
        {
          id: '210',
          nickName: '종우',
          name: '임종우',
          vote: 'monthAttend',
          time: '2024-08-10T12:25:00.000Z',
        },
        {
          id: '210',
          nickName: '규진',
          name: '김규진',
          vote: 'monthAttend',
          time: '2024-08-11T12:26:00.000Z',
        },
        {
          id: '210',
          nickName: '원진',
          name: '홍원진',
          vote: 'monthAttend',
          time: '2024-08-12T12:27:00.000Z',
        },
        {
          id: '210',
          nickName: '승호',
          name: '이승호',
          vote: 'monthAttend',
          time: '2024-08-13T18:27:00.000Z',
        },
        {
          id: '210',
          nickName: '건휘',
          name: '임건휘',
          vote: 'weekAttend',
          time: '2024-08-14T12:19:00.000Z',
        },
        {
          id: '210',
          nickName: '지원',
          name: '손지원',
          vote: 'weekAttend',
          time: '2024-08-15T12:21:00.000Z',
        },
        {
          id: '210',
          nickName: '의준',
          name: '전의준',
          vote: 'weekAttend',
          time: '2024-08-16T12:21:00.000Z',
        },
      ])

      // existingMembers.forEach(member => {
      //   let isExist = false
      //   for (let i = 0; i < voteArray.length; i++) {
      //     if (member.includes(voteArray[i].nickName)) {
      //       voteArray[i].name = member
      //       isExist = true
      //       break
      //     }
      //   }
      // })
      const monthAttenders = voteArray
        .filter((vote) => vote['vote'] === 'monthAttend')
        .sort((a, b) => new Date(a.time) - new Date(b.time))
      const weekAttenders = voteArray
        .filter((vote) => vote['vote'] === 'weekAttend')
        .sort((a, b) => new Date(a.time) - new Date(b.time))
      let attendersByVote = monthAttenders.concat(weekAttenders)
      console.log(attendersByVote)
      const otherReply = []

      voteReplyArray?.forEach((reply) => {
        if (reply.type === 1) {
          attendersByVote = attendersByVote.filter(
            (vote) => vote.nickName !== reply.name,
          )
        } else if (reply.type === 0) {
          let isAlreadyExist = false
          attendersByVote.forEach((vote) => {
            if (vote.nickName === reply.name) {
              isAlreadyExist = true
            }
          })
          if (!isAlreadyExist) {
            attendersByVote.push(reply)
          }
        } else if (reply.type === 3) {
          const outPlayer = reply
          console.log(outPlayer.name)
          if (!outPlayer.name.includes('용병')) {
            outPlayer.name = outPlayer.name + '용병' + outPlayer.count + '명'
          }
          attendersByVote.push(outPlayer)
        } else {
          otherReply.push(reply)
        }
      })
      console.log(otherReply)
      console.log(attendersByVote)
      setAttenders(attendersByVote)
      setReplies(otherReply)

      const copyStatistics = {
        ...voteStatistics,
        monthAttend: monthAttenders,
        weekAttend: weekAttenders,
      }
      // console.log(copyStatistics)
      setVoteStatistice(copyStatistics)
    }
  }, [voteList])

  return (
    <div className={boxStyle}>
      <span className="font-dnf-forged underline underline-offset-1">
        참석 명단
      </span>
      <span className="text-xs mb-2">(투표, 댓글순)</span>
      <div className={boxBorderStyle}>
        <div className="w-[80%] flex flex-col gap-1">
          <div className="flex gap-2 flex-wrap justify-center mb-4">
            {attenders?.map((player, index) => (
              <span className={playerNameStyle} key={index}>
                {player.name.slice(1)}
              </span>
            ))}
          </div>
          {/*<span className='text-md text-green-800'>월회비</span>*/}
          {/*<div className='flex gap-2 flex-wrap justify-center'>*/}
          {/*  {voteStatistics?.monthAttend?.map((player, index) => (*/}
          {/*      <span className={playerNameStyle} key={index}>{player.name}</span>))}*/}
          {/*</div>*/}
        </div>
        <Separator />
        <div className="w-[80%] flex flex-col gap-1">
          {replies?.map((reply, index) => (
            <span key={index} className="text-sm text-left">
              {reply.name.slice(1) + ': ' + reply.content}
            </span>
          ))}
        </div>
        {/*{voteStatistics.weekAttend.length > 0 &&*/}
        {/*    <div className='w-[80%] flex flex-col gap-1'>*/}
        {/*      <span className='text-md text-green-800'>주회비</span>*/}
        {/*      <div className='flex gap-2 flex-wrap justify-center'>*/}
        {/*      {voteStatistics?.weekAttend?.map((player, index) => (*/}
        {/*        <span className={playerNameStyle} key={index}>{player.name}</span>))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*}*/}
        {/*{voteStatistics.monthAttend.length + voteStatistics.weekAttend.length > 18 &&*/}
        {/*    <span className='text-xs text-gray-400 mt-2'>18명 초과 시 월회비 우선</span>}*/}
      </div>
    </div>
  )
}

export default ThisWeekVoteStatisticsBox
