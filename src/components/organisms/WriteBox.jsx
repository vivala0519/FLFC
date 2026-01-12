import { useEffect, useState, useRef } from 'react'

import RecordInput from '@/components/atoms/Text/RecordInput.jsx'
// import TestingMark from '@/components/atoms/Text/TestingMark.jsx'
import RecordTypeText from '@/components/atoms/Text/RecordTypeText.jsx'

import { uid } from 'uid'
import { getDatabase, set, onValue, ref } from 'firebase/database'

const WriteBox = (props) => {
  const { registerRef, registerHandler, data, isWriting } = props
  const { scorer, setScorer, assistant, setAssistant } = data
  const [isTyping, setIsTyping] = useState(false)
  const [otherUsersTyping, setOtherUsersTyping] = useState([])
  const registerStyle = `w-[50px] h-[50px] bg-[length:100%_100%] transform rotate-[11deg] relative bottom-[2px] right-[2px] `
  const itemStyle = `w-[20px] h-[20px] bg-[length:100%_100%] transform rotate-[11deg] relative bottom-[2px] right-[2px] `
  const goalIconStyle = 'bg-[url("@/assets/circle-ball.png")]'

  const getUserId = () => {
    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = uid()
      localStorage.setItem('userId', userId)
    }
    return userId
  }
  const userId = getUserId()

  const updateTypingStatus = (status) => {
    if (isTyping !== status) {
      const db = getDatabase()
      const typingRef = ref(db, `typing/users/${userId}`)
      set(typingRef, status)
    }
  }

  const handleBlur = () => {
    setIsTyping(false)
    updateTypingStatus(false)
  }

  const handleKeyDown = () => {
    if (!isTyping) {
      setIsTyping(true)
      updateTypingStatus(true)
    }

    // 타이머 초기화
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      updateTypingStatus(false)
    }, 2000)
  }
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    updateTypingStatus(false)
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // 다른 사용자의 타이핑 상태 감지
  useEffect(() => {
    const db = getDatabase()
    const typingRef = ref(db, 'typing/users')
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const typingUsers = Object.keys(data).filter(
          (user) => user !== userId && data[user],
        )
        setOtherUsersTyping(typingUsers)
      } else {
        setOtherUsersTyping([])
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userId])

  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (scorer.trim()) {
      setIsLeaving(true)
    } else {
      setIsLeaving(false)
    }
  }, [scorer])

  const showFastIcon = !scorer.trim() || isLeaving

  return isWriting ? (
    <div className={'w-full'}>
      <span className={'animate-pulse'}>등록 중...</span>
      <div className={'flex gap-10 justify-center mt-2'}>
        {[0, 1, 2, 3, 4].map((el, index) => (
          <div key={index} className={`animate-goal-roll-3`}>
            <div
              className={`${itemStyle} ${goalIconStyle} animate-spinFast`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <>
      <div ref={registerRef} className="flex mb-1 relative w-full h-full justify-center">
        <div className="absolute flex flex-col gap-2 left-[9%]">
          {[0, 1].map((index) => (
            <div key={index} className="flex gap-0.5 items-center">
              <RecordTypeText
                type={index === 0 ? 'GOAL' : 'ASSIST'}
                fontSize={'12px'}
                width={'70px'}
                customStyle={'z-2 left-[30px]'}
              />
              <RecordInput
                type={index === 0 ? scorer : assistant}
                setData={index === 0 ? setScorer : setAssistant}
                handleKeyDown={handleKeyDown}
                handleBlur={handleBlur}
              />
            </div>
          ))}
        </div>
        <div className={`absolute ${scorer.trim() ? 'right-[30%] top-[3px]' : 'right-[12%] top-[20px]'}`}>
          {scorer.trim() && (
            <div className={'absolute'} onClick={registerHandler}>
              <div className="animate-goal-roll-1 flex absolute">
                <div className={`${registerStyle} ${goalIconStyle} animate-spinNormal`} />
              </div>
              <span className={'animate-goal-roll-1 absolute top-[10px] left-[32px] w-[60px] h-[60px]'}>등록</span>
            </div>
          )}
          {showFastIcon && !scorer.trim() && (
            <div
              className={`${itemStyle} ${goalIconStyle} ${
                isLeaving ? 'animate-slide-out-right' : 'animate-spinFast'
              }`}
              onAnimationEnd={() => {
                if (isLeaving) {
                  setIsLeaving(false)
                }
              }}
            />
          )}
        </div>
        {otherUsersTyping.length > 0 && <div className={'relative top-[80px]'}>누군가 입력 중입니다..</div>}
      </div>
      {/*{otherUsersTyping.length > 0 && (*/}
      {/*  <TestingMark locationStyle="relative top-3 -right-20 text-[16px]" />*/}
      {/*)}*/}
    </>
  )
}

export default WriteBox
