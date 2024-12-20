import { atom } from 'jotai'

// time
const getCurrentDate = () => new Date()
const getCurrentYear = () => String(getCurrentDate().getFullYear())
const getCurrentMonth = () => getCurrentDate().getMonth() + 1
const getCurrentDateOfMonth = () => getCurrentDate().getDate()
const getCurrentDay = () => getCurrentDate().getDay()
// 오늘 날짜 형식 포맷 (MMDD)
const month = (getCurrentDate().getMonth() + 1).toString().padStart(2, '0')
const date = getCurrentDate().getDate().toString().padStart(2, '0')
const getToday = () => month + date

const getGameStartTime = new Date().setHours(7, 45, 0, 0) // 경기 시작 시간
const getGameEndTime = new Date().setHours(10, 5, 0, 0) // 경기 끝 시간
const getRecordTapCloseTime = new Date().setHours(23, 59, 0, 0) // 기록하기탭 클로즈 시간

// members
export const totalMembersAtom = atom([])
export const existingMembersAtom = atom([])
export const membersIdAtom = atom([])

// records
const realtimeRecord = {}
const todaysRealtimeRecord = {}
const requestList = []

// votes
const voteList = []

export const timeAtom = atom({
  currentTime: getCurrentDate(),
  thisYear: getCurrentYear(),
  thisMonth: getCurrentMonth(),
  thisDate: getCurrentDateOfMonth(),
  today: getToday(),
  thisDay: getCurrentDay(),
  gameStartTime: getGameStartTime,
  gameEndTime: getGameEndTime,
  recordTapCloseTime: getRecordTapCloseTime
})
export const realtimeRecordAtom = atom(realtimeRecord)
export const todaysRealtimeRecordAtom = atom(todaysRealtimeRecord)
export const requestListAtom = atom(requestList)
export const voteListAtom = atom(voteList)