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
const totalMembers = [
  "방승진",
  "임희재",
  "정우진",
  "한상태",
  "임건휘",
  "노태훈",
  "박근한",
  "전희종",
  "윤준석",
  "임종우",
  "김민관",
  "임동준",
  "윤희철",
  "임준휘",
  "이승호",
  "손지원",
  "윤영진",
  "진장용",
  "김남구",
  "이준영",
  "황은집",
  "김대건",
  "장성민",
  "이재진",
  "이원효",
  "최수혁",
  "이종호",
  "황정민",
  "김동휘",
  "안용현",
  "이진헌",
  "김민창",
  "이후현",
  "임호진",
  "김규진",
  "김동주",
  "김병일",
  "김성록",
  "박남호",
  "선우용",
  "양대열",
  "전의준",
  "차지수",
  "하민수",
  "홍원진",
  "우장식",
  "선민조",
  "황철민",
  "최봉호"
]
const existingMembers = ['홍원진', '우장식', '임희재', '윤희철', '김동휘', '이승호', '임건휘', '방승진', '김민관', '김규진', '임준휘', '전희종', '한상태', '임종우', '노태훈', '윤영진', '이원효', '황정민', '양대열', '정우진', '김남구', '박근한', '손지원', '황철민', '최봉호', '선민조', '최수혁', '김병일', '김대건', '전의준', '황은집', '진장용', '이진헌', '윤준석', '김동주', '이재진', '김성록', '박남호', '장성민', '하민수']

// records
const realtimeRecord = {}
const todaysRealtimeRecord = {}
const requestList = []

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
export const totalMembersAtom = atom(totalMembers)
export const existingMembersAtom = atom(existingMembers)
export const realtimeRecordAtom = atom(realtimeRecord)
export const todaysRealtimeRecordAtom = atom(todaysRealtimeRecord)
export const requestListAtom = atom(requestList)