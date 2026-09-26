import { useEffect, useState, useRef } from 'react'

import RecordEntryForm from '@/components/molecules/RecordEntryForm.jsx'

import { uid } from 'uid'
import { getDatabase, set, onValue, ref } from 'firebase/database'

const WriteBox = (props) => {
  const { registerRef, registerHandler, data, isWriting } = props
  const [isTyping, setIsTyping] = useState(false)
  const [otherUsersTyping, setOtherUsersTyping] = useState([])
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
      <RecordEntryForm
        data={data}
        registerRef={registerRef}
        registerHandler={registerHandler}
        handleKeyDown={handleKeyDown}
        handleBlur={handleBlur}
      />
      {otherUsersTyping.length > 0 && <div className="text-sm">누군가 입력 중입니다..</div>}
    </>
  )
}

export default WriteBox
