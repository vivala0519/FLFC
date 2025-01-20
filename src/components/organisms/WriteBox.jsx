import { useEffect, useState, useRef } from 'react'

import RecordInput from '@/components/atoms/Text/RecordInput.jsx'
// import TestingMark from '@/components/atoms/Text/TestingMark.jsx'
import RecordTypeText from '@/components/atoms/Text/RecordTypeText.jsx'
import RegisterButton from '@/components/atoms/Button/RegisterButton.jsx'

import { uid } from 'uid'
import { getDatabase, set, onValue, ref } from 'firebase/database'

const WriteBox = (props) => {
  const { registerRef, registerHandler, data } = props
  const { scorer, setScorer, assistant, setAssistant } = data
  const [isTyping, setIsTyping] = useState(false)
  const [otherUsersTyping, setOtherUsersTyping] = useState([])

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

  return (
    <>
      <div
        ref={registerRef}
        className="flex items-center gap-5 mb-1 relative -left-[17px]"
      >
        <div className="flex flex-col gap-2">
          {[0, 1].map((index) => (
            <div key={index} className="flex gap-0.5 items-center">
              <RecordTypeText
                type={index === 0 ? 'GOAL' : 'ASSIST'}
                width={'70px'}
                customStyle={'z-2 left-[30px]'}
              />
              <RecordInput
                type={index === 0 ? scorer : assistant}
                setData={index === 0 ? setScorer : setAssistant}
                handleKeyDown={handleKeyDown}
              />
            </div>
          ))}
        </div>
        <RegisterButton
          text={'등록'}
          clickHandler={registerHandler}
          active={true}
          customStyle={'bottom-[11px] '}
        />
      </div>
      {/*{otherUsersTyping.length > 0 && (*/}
      {/*  <TestingMark locationStyle="relative top-3 -right-20 text-[16px]" />*/}
      {/*)}*/}
      {otherUsersTyping.length > 0 && <div>누군가 입력 중입니다..</div>}
    </>
  )
}

export default WriteBox
