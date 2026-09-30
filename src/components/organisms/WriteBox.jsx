import { useCallback, useEffect, useMemo, useState, useRef } from 'react'

import RecordEntryForm from '@/components/molecules/RecordEntryForm.jsx'

import { uid } from 'uid'
import { getDatabase, set, onDisconnect, onValue, ref } from 'firebase/database'

const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = uid()
    localStorage.setItem('userId', userId)
  }
  return userId
}

const reportTypingError = (error) => console.error('Failed to update typing status:', error)

const WriteBox = (props) => {
  const { registerHandler, data, isWriting, editingRecordKey } = props
  const [otherUsersTyping, setOtherUsersTyping] = useState([])
  const [userId] = useState(getUserId)
  const db = useMemo(() => getDatabase(), [])
  const typingRef = useMemo(() => ref(db, `typing/users/${userId}`), [db, userId])
  const isTypingRef = useRef(false)
  const connectionReadyRef = useRef(false)
  const typingTimeoutRef = useRef(null)

  const updateTypingStatus = useCallback((status) => {
    if (isTypingRef.current === status) return
    isTypingRef.current = status
    if (connectionReadyRef.current) {
      void set(typingRef, status).catch(reportTypingError)
    }
  }, [typingRef])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    updateTypingStatus(false)
  }, [updateTypingStatus])

  const handleKeyDown = () => {
    if (editingRecordKey || isWriting) return
    updateTypingStatus(true)

    // 타이머 초기화
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(stopTyping, 2000)
  }

  useEffect(() => {
    if (editingRecordKey || isWriting) stopTyping()
  }, [editingRecordKey, isWriting, stopTyping])

  useEffect(() => {
    let active = true
    let revision = 0
    const unsubscribe = onValue(ref(db, '.info/connected'), (snapshot) => {
      const currentRevision = ++revision
      connectionReadyRef.current = false
      if (snapshot.val() !== true) return

      // Register server-side cleanup before publishing, including after reconnection.
      onDisconnect(typingRef).set(false).then(() => {
        if (!active || currentRevision !== revision) return
        connectionReadyRef.current = true
        return set(typingRef, isTypingRef.current)
      }).catch(reportTypingError)
    }, reportTypingError)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopTyping()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', stopTyping)

    return () => {
      active = false
      revision++
      connectionReadyRef.current = false
      isTypingRef.current = false
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', stopTyping)
      void set(typingRef, false).catch(reportTypingError)
    }
  }, [db, typingRef, stopTyping])

  // 다른 사용자의 타이핑 상태 감지
  useEffect(() => {
    const typingRef = ref(db, 'typing/users')
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const typingUsers = Object.keys(data).filter(
          (user) => user !== userId && data[user] === true,
        )
        setOtherUsersTyping(typingUsers)
      } else {
        setOtherUsersTyping([])
      }
    }, reportTypingError)

    return () => {
      unsubscribe()
    }
  }, [db, userId])

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
        handleBlur={stopTyping}
        busy={isWriting}
      />
      {!isWriting && otherUsersTyping.length > 0 && <div className="text-sm">누군가 입력 중입니다..</div>}
    </>
  )
}

export default WriteBox
