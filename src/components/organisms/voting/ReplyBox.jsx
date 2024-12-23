import { useState, useEffect, useRef } from 'react'

import ReplyElement from '@/components/atoms/ReplyElement.jsx'
import SelectElement from '@/components/atoms/SelectElement.jsx'
import AddFriendPlayersStep1 from '../../molecules/voting/AddFriendPlayersStep1.jsx'
import AddFriendPlayersStep2 from '../../molecules/voting/AddFriendPlayersStep2.jsx'

import { uid } from 'uid'
import getTimes from '@/hooks/getTimes.js'
import { getDatabase, ref, remove, set } from 'firebase/database'

const ReplyBox = (props) => {
  const { thisWeekVoteReply, nextSunday, userInfo, endVote } = props
  const {
    time: { thisYear },
  } = getTimes()
  const [directReplyContent, setDirectReplyContent] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [inputMode, setInputMode] = useState(false)
  const [guestType, setGuestType] = useState('')
  const [addPlayerMode, setAddPlayerMode] = useState(false)
  const [addPlayerStep, setAddPlayerStep] = useState(-1)
  const [additionalPlayerCount, setAdditionalPlayerCount] = useState(1)
  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)
  const selectList = [
    { selectText: '참석으로 변경 ✔️', replyText: '참석으로 변경' },
    {
      selectText: '불참으로 변경 <span class="text-red-500">✘</span>',
      replyText: '불참으로 변경',
    },
    { selectText: '키퍼로 참여 🧤', replyText: '키퍼로 참여' },
    { selectText: '용병 추가 👥' },
    { selectText: '직접 입력' },
    { selectText: '취소' },
  ]
  const guestTypeText = {
    guest: '외부',
    friend: '지인',
  }

  // style
  const boxStyle =
    'absolute w-10/12 ' +
    `${!endVote ? 'top-[30rem] ' : 'top-[26.5rem] '}` +
    `${thisWeekVoteReply?.length > 0 ? 'h-[40%]' : showMenu ? 'h-[45%]' : 'h-0'}`
  const showMenuButtonStyle =
    'w-full h-[40px] flex flex-col justify-center border-2 border-gray-200 rounded-sm mt-3'
  const inputBoxStyle = 'flex flex-col items-center justify-center w-full mt-2'
  const listStyle =
    `${inputMode ? 'h-[70%]' : showMenu ? 'h-[90%]' : 'max-h-[90%] h-fit'}` +
    ' bg-gray-50 rounded-lg shadow-md overflow-y-auto '
  const directReplyInput =
    'w-full h-[40px] border-2 border-gray-200 rounded-sm mt-2 mb-2'

  // db 등록 function
  const registerReply = async (reply) => {
    const rtDb = getDatabase()
    await set(
      ref(rtDb, 'vote/' + thisYear + '/' + nextSunday + '_reply/' + reply.id),
      reply,
    )

    // 스크롤 밑으로
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight
      scrollContainer.scrollTo({
        top: scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  // select list 선택 function
  const selectReply = (idx) => {
    if (idx < 3) {
      const id = uid()
      const reply = {
        id: id,
        time: new Date().toISOString(),
        type: idx,
        content: selectList[idx]['replyText'],
        name: userInfo['name'] || userInfo['nickName'],
      }
      registerReply(reply)
      // 용병 입력
    } else if (idx === 3) {
      setInputMode(true)
      setAddPlayerMode(true)
      setAddPlayerStep(0)
      // 댓글 직접 입력
    } else if (idx === 4) {
      setInputMode(true)
      // 취소
    } else if (idx === 5) {
      setGuestType('')
      setInputMode(false)
      setAddPlayerStep(-1)
      setAddPlayerMode(false)
      setDirectReplyContent('')
      setAdditionalPlayerCount(1)
    }
    setShowMenu(false)
  }

  // 삭제 function
  const deleteReply = (id) => {
    const db = getDatabase()
    const recordRef = ref(
      db,
      'vote/' + thisYear + '/' + nextSunday + '_reply/' + id,
    )
    remove(recordRef)
      .then(() => {
        console.log('Document successfully deleted!')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  // 직접 입력 버튼 handler
  const registerButtonHandler = (idx) => {
    if (idx === 4 && !directReplyContent) {
      return
    }
    const id = uid()
    const reply = {
      id: id,
      time: new Date().toISOString(),
      type: idx,
      count: additionalPlayerCount,
      content: addPlayerMode
        ? guestTypeText[guestType] +
          ' 용병 ' +
          additionalPlayerCount +
          '명 있습니다'
        : directReplyContent,
      name: userInfo['name'] || userInfo['nickName'],
    }
    registerReply(reply)
    setGuestType('')
    setInputMode(false)
    setAddPlayerStep(-1)
    setAddPlayerMode(false)
    setDirectReplyContent('')
    setAdditionalPlayerCount(1)
  }

  useEffect(() => {
    console.log(guestType)
    if (guestType) {
      setAddPlayerStep(1)
    }
  }, [guestType])

  useEffect(() => {
    if (inputMode && !addPlayerMode && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      }, 100)
    }
  }, [inputMode])

  return (
    <div className={boxStyle}>
      {showMenu ? (
        <div className={listStyle + 'pt-0 flex flex-col gap-2 relative'}>
          {selectList?.map((select, idx) => (
            <SelectElement
              key={idx}
              text={select['selectText']}
              clickHandler={() => selectReply(idx)}
            />
          ))}
        </div>
      ) : (
        <div className={listStyle} ref={scrollContainerRef}>
          {thisWeekVoteReply?.map((reply, idx) => (
            <ReplyElement
              key={idx}
              userInfo={userInfo}
              reply={reply}
              deleteHandler={() => deleteReply(reply.id)}
            />
          ))}
        </div>
      )}
      <div className={inputBoxStyle}>
        {/*default mode*/}
        {!showMenu && !inputMode && (
          <div
            className={showMenuButtonStyle}
            onClick={() => setShowMenu(true)}
          >
            댓글 등록
          </div>
        )}
        {/*용병 입력*/}
        {inputMode &&
          addPlayerMode &&
          (addPlayerStep === 0 ? (
            <AddFriendPlayersStep1 setGuestType={setGuestType} />
          ) : (
            <AddFriendPlayersStep2
              additionalPlayerCount={additionalPlayerCount}
              setAdditionalPlayerCount={setAdditionalPlayerCount}
            />
          ))}
        {/*직접 입력*/}
        {inputMode && !addPlayerMode && (
          <input
            ref={inputRef}
            className={directReplyInput}
            value={directReplyContent}
            placeholder={' 입력해 주세요'}
            onChange={(e) => setDirectReplyContent(e.target.value)}
          />
        )}
        {/*직접, 용병 입력 등록 버튼*/}
        {inputMode && addPlayerStep !== 0 && (
          <SelectElement
            text={'등록'}
            clickHandler={() => registerButtonHandler(addPlayerMode ? 3 : 4)}
          />
        )}
      </div>
      {inputMode && (
        <SelectElement
          text={'취소'}
          inputMode={inputMode}
          clickHandler={() => selectReply(5)}
        />
      )}
    </div>
  )
}

export default ReplyBox
