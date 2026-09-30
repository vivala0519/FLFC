import { useEffect, useState, useRef } from 'react'

import RecordEntryForm from '@/components/molecules/RecordEntryForm.jsx'

import { uid } from 'uid'
import { getDatabase, set, onValue, ref } from 'firebase/database'

const WriteBox = (props) => {
  const { registerHandler, data, isWriting, editingRecordKey } = props
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
    if (!editingRecordKey) return
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (isTyping) {
      setIsTyping(false)
      set(ref(getDatabase(), `typing/users/${userId}`), false)
    }
  }, [editingRecordKey, isTyping, userId])

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

  return editingRecordKey ? (
    <div className="py-3 text-center text-sm" role="status">
      <p className="text-xl font-semibold text-black dark:text-white">수정중..</p>
      <p className="mt-1 text-gray-400 dark:text-gray-400">수정중인 기록을 완료해주세요</p>
    </div>
  ) : (
    <>
      <RecordEntryForm
        data={data}
        registerHandler={registerHandler}
        handleKeyDown={handleKeyDown}
        handleBlur={handleBlur}
        busy={isWriting}
      />
      {!isWriting && otherUsersTyping.length > 0 && <div className="text-sm">누군가 입력 중입니다..</div>}
    </>
  )
}

export default WriteBox
