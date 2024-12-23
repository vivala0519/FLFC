import { useEffect, useState } from 'react'
import getVotes from '@/hooks/getVotes.js'
import getMembers from '@/hooks/getMembers.js'

import VoteTemplate from '@/components/templates/VoteTemplate.jsx'
import RemainTime from '@/components/molecules/voting/RemainTime.jsx'
import GoToHomeButton from '@/components/atoms/Button/GoToHomeButton.jsx'
import TestingMark from '@/components/atoms/Text/TestingMark.jsx'

import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase.js'

const VotingPage = () => {
  const { voteList } = getVotes()
  const { existingMembers, membersId } = getMembers()
  const [userInfo, setUserInfo] = useState(null)
  const [nextSunday, setNextSunday] = useState(null)
  const [endVote, setEndVote] = useState(false)
  const [thisWeekVote, setThisWeekVote] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loadingFlag, setLoadingFlag] = useState(false)
  const [thisWeekVoteReply, setThisWeekVoteReply] = useState(null)

  // style
  const votingPageStyle = `flex flex-col h-full items-center justify-center ${isDarkMode ? 'dark' : ''}`
  const kakaoLoginButtonStyle =
    'bg-kakao-login bg-[length:100%_100%] w-[80px] h-[40px]'

  useEffect(() => {
    setLoadingFlag(true)
    const today = new Date()
    const currentDay = today.getDay()
    const daysUntilSunday = 7 - currentDay
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilSunday)

    const sundayDate = nextSunday.getDate()
    const sundayMonth = nextSunday.getMonth() + 1
    const id = `${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`
    setNextSunday(id)

    if (voteList[id]) {
      setThisWeekVote(voteList[id])
      setLoadingFlag(false)
    }
    if (voteList[id + '_reply']) {
      const thisWeekVoteReplyObj = voteList[id + '_reply']
      const replyList = Object.values(thisWeekVoteReplyObj).sort(
        (a, b) => new Date(a.time) - new Date(b.time),
      )
      setThisWeekVoteReply(replyList)
    } else {
      setThisWeekVoteReply([])
    }
    // if (voteList.length === 0 && thisYear) {
    //   const db = getDatabase()
    //   const id = `${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`
    //
    //   console.log(id)
    //
    //   const thisWeekVote = {
    //     id: id,
    //   }
    //   set(ref(db, 'vote' + '/' + thisYear + '/' + id), thisWeekVote)
    // }
  }, [voteList, isLoggedIn])

  const setFLFCMember = (info) => {
    const ids = Object.values(membersId).map((member) => member.id)
    if (ids.length > 0) {
      if (!ids.includes(info.id)) {
        // nickName 으로 저장
        info.nickName = info.properties['nickname']
        // existingMembers에 속하는 이름이면 name 에 풀네임 저장
        for (let i = 0; i < existingMembers.length; i++) {
          if (existingMembers[i].includes(info.properties['nickname'])) {
            info.name = existingMembers[i]
            break
          }
        }
        const copiedMembersIdObj = { ...membersId }
        copiedMembersIdObj[info.id] = info
        const registerMember = async () => {
          const docRef = doc(db, 'members', 'members_id')
          await setDoc(docRef, copiedMembersIdObj)
          console.log('Document written with ID: ', docRef.id)
        }
        registerMember()
      }
    }
    return info
  }

  // 세션 살아있을 때
  useEffect(() => {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(import.meta.env.VITE_KAKAO_API_KEY)
    }
    const token = window.Kakao.Auth.getAccessToken()
    if (token) {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: (res) => {
          // console.log('사용자 정보', res)
          const ids = Object.values(membersId).map((member) => member.id)
          if (ids.length > 0) {
            if (ids.includes(res.id)) {
              console.log('1111111111')
              console.log(Object.values(membersId))
              console.log(res.id)
              const member = Object.values(membersId).find(
                (member) => member.id === res.id,
              )
              console.log(member)
              setUserInfo(member)
            } else {
              console.log('2222222')
              const info = setFLFCMember({ ...res })
              setUserInfo(info)
            }
          }
          // const info = setFLFCMember({...res})
          // console.log(info)
          // setUserInfo(info)
          setIsLoggedIn(true)
        },
        fail: (error) => {
          console.error('사용자 정보 요청 실패', error)
          setIsLoggedIn(false)
        },
      })
    }
  }, [existingMembers])

  const loginWithKakao = () => {
    window.Kakao.Auth.login({
      success: (authObj) => {
        console.log('카카오 로그인 성공', authObj)
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res) => {
            console.log('사용자 정보', res)
            const ids = Object.values(membersId).map((member) => member.id)
            if (ids.length > 0) {
              if (ids.includes(res.id)) {
                console.log('1111111111')
                const member = Object.values(membersId).find(
                  (member) => member.id === res.id,
                )
                setUserInfo(member)
              } else {
                console.log('2222222')
                const info = setFLFCMember({ ...res })
                setUserInfo(info)
              }
            }
            setIsLoggedIn(true)
          },
          fail: (error) => {
            console.error('사용자 정보 요청 실패', error)
          },
        })
      },
      fail: (err) => {
        console.error('카카오 로그인 실패', err)
      },
    })
  }

  const logoutFunction = () => {
    window.Kakao.Auth.logout()
    window.location.reload()
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)

    const handleChange = (e) => {
      setIsDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <div className={votingPageStyle}>
      {loadingFlag && (
        <div className="absolute z-20 bg-white w-[120%] h-[120%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      <GoToHomeButton />
      <TestingMark locationStyle="top-4 right-1" />
      {/*<div className="absolute top-10" onClick={logoutFunction}>*/}
      {/*  Test 로그아웃*/}
      {/*</div>*/}
      <RemainTime setEndVote={setEndVote} />
      {!isLoggedIn ? (
        <button className={kakaoLoginButtonStyle} onClick={loginWithKakao} />
      ) : (
        <VoteTemplate
          userInfo={userInfo}
          thisWeekVote={thisWeekVote}
          thisWeekVoteReply={thisWeekVoteReply}
          nextSunday={nextSunday}
          endVote={endVote}
        />
      )}
    </div>
  )
}

export default VotingPage
