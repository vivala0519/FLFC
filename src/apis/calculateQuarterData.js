import { db } from '../../firebase.js'
import { extractActiveMembers } from './members.js'

import { collection, getDocs } from 'firebase/firestore'

export const extractQuarterData = async (yearParameter) => {
  const thisYear = new Date().getFullYear()
  const year = yearParameter ? yearParameter : String(thisYear)
  const collectionRef = collection(db, year)
  const snapshot = await getDocs(collectionRef)
  const fetchedData = snapshot.docs.map((doc) => ({
    id: doc.id,
    data: doc.data(),
  }))

  const generateByQuarter = (quarterData, quarterStats) => {
    quarterData?.forEach((item) => {
      const idData = item.data
      for (const name in idData) {
        if (Object.prototype.hasOwnProperty.call(idData, name)) {
          const stats = idData[name]
          if (!quarterStats.has(name)) {
            quarterStats.set(name, { 골: 0, 어시: 0, 출석: 0 })
          }
          const existingStats = quarterStats.get(name)
          existingStats['골'] += parseInt(stats['골'] || 0)
          existingStats['어시'] += parseInt(stats['어시'] || 0)
          existingStats['출석'] += stats['출석'] ? stats['출석'] : 0
        }
      }
    })
  }

  // 2021년은 분기없이 총합
  if (year === '2021') {
    const totalQuarterStats = new Map()
    generateByQuarter(fetchedData, totalQuarterStats)
    const totalQuarterData = {
      members: extractActiveMembers(totalQuarterStats, true),
      totalData: totalQuarterStats,
    }
    return { totalQuarterData: [totalQuarterData] }
  }

  // 1분기 이름별 통계 취합
  const firstQuarter = fetchedData.filter(
    (item) => Number(item.id.slice(0, 2)) <= 3,
  )
  const firstQuarterStats = new Map()
  generateByQuarter(firstQuarter, firstQuarterStats)
  const firstQuarterData = {
    members: extractActiveMembers(firstQuarterStats, true),
    totalData: firstQuarterStats,
  }

  // 2분기 이름별 통계 취합
  const secondQuarter = fetchedData.filter(
    (item) =>
      Number(item.id.slice(0, 2)) > 3 && Number(item.id.slice(0, 2)) <= 6,
  )
  const secondQuarterStats = new Map()
  generateByQuarter(secondQuarter, secondQuarterStats)
  const secondQuarterData = {
    members: extractActiveMembers(secondQuarterStats, true),
    totalData: secondQuarterStats,
  }

  // 3분기 이름별 통계 취합
  const thirdQuarter = fetchedData.filter(
    (item) =>
      Number(item.id.slice(0, 2)) > 6 && Number(item.id.slice(0, 2)) <= 9,
  )
  const thirdQuarterStats = new Map()
  generateByQuarter(thirdQuarter, thirdQuarterStats)
  const thirdQuarterData = {
    members: extractActiveMembers(thirdQuarterStats, true),
    totalData: thirdQuarterStats,
  }

  // 4분기 이름별 통계 취합
  const fourthQuarter = fetchedData.filter(
    (item) => Number(item.id.slice(0, 2)) > 9,
  )
  const fourthQuarterStats = new Map()
  generateByQuarter(fourthQuarter, fourthQuarterStats)
  const fourthQuarterData = {
    members: extractActiveMembers(fourthQuarterStats, true),
    totalData: fourthQuarterStats,
  }

  return {
    totalQuarterData: [
      firstQuarterData,
      secondQuarterData,
      thirdQuarterData,
      fourthQuarterData,
    ],
  }
}

export default extractQuarterData
