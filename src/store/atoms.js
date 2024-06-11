import { atom } from 'jotai'

const getCurrentDate = () => new Date()
const getCurrentYear = () => getCurrentDate().getFullYear()
const getCurrentMonth = () => getCurrentDate().getMonth() + 1
const getCurrentDateOfMonth = () => getCurrentDate().getDate()
const getCurrentDay = () => getCurrentDate().getDay()

// 오늘 날짜 형식 포맷 (MMDD)
const month = (getCurrentDate().getMonth() + 1).toString().padStart(2, '0')
const date = getCurrentDate().getDate().toString().padStart(2, '0')
const getToday = () => month + date

export const currentTimeAtom = atom(getCurrentDate())
export const thisYearAtom = atom(getCurrentYear())
export const thisMonthAtom = atom(getCurrentMonth())
export const thisDateAtom = atom(getCurrentDateOfMonth())
export const todayAtom = atom(getToday())
export const thisDayAtom = atom(getCurrentDay())