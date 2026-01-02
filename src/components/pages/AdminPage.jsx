import getMembers from '@/hooks/getMembers.js'

import { useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'

import { db } from '../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'

const AdminPage = (props) => {
  const { recordData, weeklyTeamData } = props
  const { existingMembers } = getMembers()
  const {
    time: { thisYear, currentTime },
  } = getTimes()
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0')
  const date = currentTime.getDate().toString().padStart(2, '0')
  const [loadingFlag, setLoadingFlag] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [totalFirestoreData, setTotalFirestoreData] = useState([])
  const [threeMonthData, setThreeMonthData] = useState([])
  const [threeMonthNonePlayer, setThreeMonthNonePlayer] = useState([])
  const [threeMonthNonePlayerInfo, setThreeMonthNonePlayerInfo] = useState([])

  useEffect(() => {
    let resultArr = []
    threeMonthNonePlayer.forEach((player) => {
      let lastAttendanceDate = ''
      totalFirestoreData.forEach((data) => {
        if (Object.keys(data.data).includes(player)) {
          lastAttendanceDate = data.id
        }
      })
      resultArr.push([player, lastAttendanceDate])
    })
    resultArr = resultArr.sort((a, b) => {
      const dateA = a[1] || '0'
      const dateB = b[1] || '0'
      return dateA.localeCompare(dateB)
    })
    setThreeMonthNonePlayerInfo(resultArr)
  }, [threeMonthData, threeMonthNonePlayer, totalFirestoreData])

  const getLastSundayToTodayRange = () => {
    const today = new Date()

    // Step 1: 오늘이 일요일인지 확인
    const isSunday = today.getDay() === 0 // 0 = Sunday

    // Step 2: 오늘이 일요일이면 오늘 날짜 사용, 아니면 직전 일요일로 이동
    const lastSunday = isSunday
      ? today
      : new Date(today.setDate(today.getDate() - today.getDay()))

    // Step 3: 3개월 전 날짜 계산
    const threeMonthsAgo = new Date(
      lastSunday.getFullYear(),
      lastSunday.getMonth() - 3,
      lastSunday.getDate(),
    )

    return {
      startDate: threeMonthsAgo,
      endDate: lastSunday,
    }
  }

  const getDataFunction = async (startDate) => {
    console.log('getDataFunction')
    const sinceYear = 2022

    const fetchAll = async () => {
      const thisYearNum = Number(thisYear) // 또는 new Date().getFullYear()
      if (!Number.isFinite(thisYearNum)) {
        console.warn('thisYear is not ready:', thisYear)
        return
      }

      let cancelled = false

      try {
        const years = Array.from(
          { length: thisYearNum - sinceYear + 1 },
          (_, idx) => sinceYear + idx,
        )

        const results = await Promise.all(
          years.map(async (y) => {
            const snap = await getDocs(collection(db, String(y)))
            return snap.docs
              .map((doc) => ({
                id: String(y).slice(2, 4) + doc.id,
                data: doc.data(),
              }))
              .filter((d) => !d.id.includes('last_season_kings'))
          }),
        )

        const dataList = results.flat()
        const idToDateKST = (id) => {
          const yy = Number(id.slice(0, 2))
          const mm = Number(id.slice(2, 4))
          const dd = Number(id.slice(4, 6))

          const year = 2000 + yy // 필요하면 1900/2000 기준 규칙 바꿔주세요
          const iso = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T00:00:00+09:00`
          return new Date(iso)
        }

        // startDate가 Date 객체면 그대로 쓰고, 문자열이면 new Date로 변환
        const start = new Date(startDate)

        const filtered = dataList.filter((obj) => {
          return idToDateKST(obj.id) >= start
        })
        setThreeMonthData(filtered)
        setLoadingFlag(false)

        if (!cancelled) setTotalFirestoreData(dataList)
      } catch (e) {
        console.error('Firestore getDocs failed:', e)
      }

      return () => {
        cancelled = true
      }
    }
    await fetchAll()
  }

  useEffect(() => {
    const players = []
    threeMonthData?.forEach((data) => {
      Object.keys(data['data']).forEach((name) => {
        if (!players.includes(name)) {
          players.push(name)
        }
      })
    })
    // console.log('existing : ', existingMembers)
    // console.log(players)
    const setMembers = new Set(existingMembers)
    const setPlayers = new Set(players)
    const difference = [...setMembers].filter((name) => !setPlayers.has(name))
    setThreeMonthNonePlayer(difference)
  }, [threeMonthData])

  useEffect(() => {
    setLoadingFlag(true)
    const range = getLastSundayToTodayRange()
    setStartDate(range.endDate.toISOString().slice(0, 10))

    getDataFunction(range.startDate)
  }, [])

  return (
    <div>
      {loadingFlag && (
        <div className="absolute z-20 bg-white w-full h-full flex flex-col items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
          <span>데이터 불러오는 중</span>
        </div>
      )}
      <div>
        <p>직전 일요일 ({startDate}) 기준</p>
        <p>3개월 이상 미참여 인원 목록</p>
        {threeMonthData.length > 0 ?
          <table className="w-full mt-5">
            <thead>
              <tr>
                <th style={{ padding: '8px' }}>이름</th>
                <th style={{ padding: '8px' }}>마지막 참여일</th>
              </tr>
            </thead>
            <tbody>
              {threeMonthNonePlayerInfo.map((data) => (
                <tr key={data[0]}>
                  <td style={{ padding: '8px' }}>{data[0]}</td>
                  <td style={{ padding: '8px' }}>{data[1] ? data[1] : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          :
          <span className={'mt-5 text-lg'}>데이터 불러오기 실패했습니다. 새로고침 해주세요</span>
        }
      </div>
    </div>
  )
}

export default AdminPage
