// import Swal from 'sweetalert2'
import styled from 'styled-components'
import getMembers from '@/hooks/getMembers.js'

import { uid } from 'uid'
import { useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { getDatabase, ref, onValue, update, set } from 'firebase/database'

import { db } from '../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'

const AdminPage = (props) => {
  const { recordData, weeklyTeamData } = props
  const { existingMembers } = getMembers()
  const {
    time: { thisYear },
  } = getTimes()
  const currentTime = new Date()
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0')
  const date = currentTime.getDate().toString().padStart(2, '0')
  const today = month + date

  const [startDate, setStartDate] = useState('')
  const [totalFirestoreData, setTotalFirestoreData] = useState([])
  const [threeMonthData, setThreeMonthData] = useState([])
  const [threeMonthNonePlayer, setThreeMonthNonePlayer] = useState([])
  const [threeMonthNonePlayerInfo, setThreeMonthNonePlayerInfo] = useState([])
  const [showTable, setShowTable] = useState(true)
  const [password, setPassword] = useState('')
  const [todayRecordObj, setTodayRecordObj] = useState({})
  const [todayRecord, setTodayRecord] = useState([])
  const [resolvedList, setResolvedList] = useState([])
  const [requestList, setRequestList] = useState([])
  const [writtenData, setWrittenData] = useState([])
  const [showRecordInput, setShowRecordInput] = useState(false)
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')

  // const passwordCheck = async () => {
  //   const { value: password } = await Swal.fire({
  //     title: '비밀번호 입력해주세요',
  //     input: 'password',
  //     inputPlaceholder: '********',
  //   })
  //   setPassword(password)
  // }
  // useEffect(() => {
  //   passwordCheck()
  // }, [])
  //
  // useEffect(() => {
  //   if (password === '0413') {
  //     setShowTable(true)
  //   } else {
  //     setPassword(null)
  //     passwordCheck()
  //   }
  // }, [password])

  useEffect(() => {
    if (showTable) {
      const db = getDatabase()

      const todayRef = ref(db, thisYear + '/')
      onValue(todayRef, (snapshot) => {
        const data = snapshot.val()
        setTodayRecordObj(data)
      })
      const data = recordData?.find((obj) => obj.id === today)
      if (data?.data) {
        setWrittenData(data.data)
      }
    }
  }, [showTable])

  const parseTimeString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  useEffect(() => {
    const isData = todayRecordObj[today]
    if (isData) {
      const recordArray = Object.values(isData)
      const sortedRecordArray = recordArray.sort((a, b) => {
        const timeA = parseTimeString(a.time)
        const timeB = parseTimeString(b.time)

        return timeA - timeB
      })
      setTodayRecord(sortedRecordArray)
    }
    const isRequestList = todayRecordObj[today + '_request']
    if (isRequestList) {
      const requestList = Object.values(isRequestList)
      const sortedRequestArray = requestList.sort((a, b) => {
        const timeA = parseTimeString(a.time)
        const timeB = parseTimeString(b.time)

        return timeA - timeB
      })
      setRequestList(
        sortedRequestArray.filter((request) => request.status === 'processing'),
      )
      setResolvedList(
        sortedRequestArray.filter((request) => request.status === 'resolved'),
      )
    }
  }, [todayRecordObj])

  const resolveHandler = (id) => {
    const updateData = requestList.find((request) => request.id === id)
    updateData.status = 'resolved'

    const db = getDatabase()
    update(ref(db, thisYear + '/' + today + '_request/' + id), updateData)
      .then(() => {
        console.log('Document successfully updated!')
      })
      .catch((error) => {
        console.error('Error updating document: ', error)
      })
  }

  const goalInputChangeHandler = (index, newGoal) => {
    setTodayRecord((prevRecords) => {
      const newRecords = [...prevRecords]
      newRecords[index] = { ...newRecords[index], goal: newGoal }
      return newRecords
    })
  }

  const assistInputChangeHandler = (index, newAssist) => {
    setTodayRecord((prevRecords) => {
      const newRecords = [...prevRecords]
      newRecords[index] = { ...newRecords[index], assist: newAssist }
      return newRecords
    })
  }

  const formatRecordByName = (record) => {
    const stats = {}
    if (weeklyTeamData?.data && weeklyTeamData?.id === today) {
      const data = weeklyTeamData.data
      const thisWeekMembers = data[1].concat(data[2], data[3])
      thisWeekMembers.forEach((member) => {
        players.forEach((player) => {
          if (member && player.includes(member)) {
            stats[player] = { 출석: 1, 골: 0, 어시: 0 }
          }
        })
      })

      record.forEach((item) => {
        const { assist, goal } = item

        if (goal !== '') {
          players.forEach((player) => {
            if (player.includes(goal) && stats[player]) {
              stats[player]['골']++
            }
          })
        }

        if (assist !== '') {
          players.forEach((player) => {
            if (player.includes(assist) && stats[player]) {
              stats[player]['어시']++
            }
          })
        }
      })
      return stats
    }
  }
  function compareObjects(objA, objB) {
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) {
      return false
    }
    for (let key of keysA) {
      if (
        objA[key]['출석'] !== objB[key]['출석'] ||
        objA[key]['골'] !== objB[key]['골'] ||
        objA[key]['어시'] !== objB[key]['어시']
      ) {
        return false
      }
    }
    return true
  }
  const addRecordHandler = () => {
    const rtdb = getDatabase()
    const time =
      currentTime.getHours().toString().padStart(2, '0') +
      ':' +
      currentTime.getMinutes().toString().padStart(2, '0') +
      ':' +
      currentTime.getSeconds().toString().padStart(2, '0')
    const id = uid()

    if (scorer.trim()) {
      const record = {
        id: id,
        time: time,
        goal: scorer.trim(),
        assist: assistant.trim(),
      }
      set(ref(rtdb, thisYear + '/' + today + '/' + id), record)
      set(ref(rtdb, thisYear + '/' + today + '_backup' + '/' + id), record)

      const copiedRecord = [...todayRecord]
      copiedRecord.push(record)
      const stats = formatRecordByName(copiedRecord)
      if (stats) {
        const registerRecord = async () => {
          const docRef = doc(db, thisYear, today)
          await setDoc(docRef, stats)
          console.log('Document written with ID: ', docRef.id)
        }
        if (!compareObjects(stats, writtenData)) {
          registerRecord()
        }
      }
    }
    setScorer('')
    setAssistant('')
    setShowRecordInput(false)
  }
  const updateRecordHandler = (id) => {
    const updateRecord = todayRecord.find((record) => record.id === id)
    const rtdb = getDatabase()
    update(ref(rtdb, thisYear + '/' + today + '/' + id), updateRecord)
      .then(() => {
        console.log('Document successfully updated!')

        const stats = formatRecordByName(todayRecord)
        if (stats) {
          const registerRecord = async () => {
            const docRef = doc(db, thisYear, today)
            await setDoc(docRef, stats)
            console.log('Document written with ID: ', docRef.id)
          }
          if (!compareObjects(stats, writtenData)) {
            registerRecord()
          }
        }
      })
      .catch((error) => {
        console.error('Error updating document: ', error)
      })
  }

  const scorerHandler = (e) => {
    setScorer(e.target.value)
  }

  const assistantHandler = (e) => {
    setAssistant(e.target.value)
  }

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
    console.log(resultArr)
    setThreeMonthNonePlayerInfo(resultArr)
  }, [threeMonthNonePlayer, totalFirestoreData])

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
    // 전체 데이터 generate
    const sinceYear = 2021
    const dataList = []
    for (let i = sinceYear; i < Number(thisYear) + 1; i++) {
      const yearCollectionRef = collection(db, String(i))
      const yearSnapshot = await getDocs(yearCollectionRef)
      const fetchedYearData = yearSnapshot.docs
        .map((doc) => ({
          id: String(i).slice(2, 4) + doc.id,
          data: doc.data(),
        }))
        .filter((data) => !data.id.includes('last_season_kings'))
      fetchedYearData.forEach((data) => dataList.push(data))
    }
    setTotalFirestoreData(dataList)

    // 3개월 데이터 추출
    const startDateYear = String(startDate.getFullYear())
    const collectionRef = collection(db, startDateYear)
    const snapshot = await getDocs(collectionRef)
    const fetchedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }))
    let filteredIds = fetchedData.filter((data) => {
      const idMonth = parseInt(data['id'].slice(0, 2), 10) - 1
      const idDay = parseInt(data['id'].slice(2, 4), 10)

      const idDate = new Date(Number(startDateYear), idMonth, idDay)

      return idDate >= startDate
    })

    if (startDateYear !== thisYear) {
      const thisYearCollectionRef = collection(db, thisYear)
      const thisYearSnapshot = await getDocs(thisYearCollectionRef)
      const fetchedThisYearData = thisYearSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }))
        .filter((data) => data.id !== 'last_season_kings')
      filteredIds = filteredIds.concat(fetchedThisYearData)
    }
    setThreeMonthData(filteredIds)
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
    const tempMembers = existingMembers.filter((member) => member !== '선우용')
    const setMembers = new Set(tempMembers)
    const setPlayers = new Set(players)
    const difference = [...setMembers].filter((name) => !setPlayers.has(name))
    setThreeMonthNonePlayer(difference)
  }, [threeMonthData])

  useEffect(() => {
    const range = getLastSundayToTodayRange()
    setStartDate(range.endDate.toISOString().slice(0, 10))

    getDataFunction(range.startDate)
  }, [])

  return (
    <div>
      <div>
        <p>직전 일요일 ({startDate}) 기준</p>
        <p>3개월 이상 미참여 인원 목록</p>
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
      </div>
      {resolvedList.length > 0 && requestList.length > 0 && (
        <div>
          <span>기록 수정 요청 사항</span>
          <div className="border-2 border-amber-200 mt-2 h-32 overflow-y-auto p-1 flex flex-col gap-2">
            {resolvedList.map((request, index) => {
              return (
                <div key={index}>
                  <div className="flex items-center">
                    <div className="mr-2">
                      <Complete />
                    </div>
                    <div className="flex flex-row justify-between items-center gap-3 w-full">
                      <span
                        className="text-xs flex items-center h-full"
                        style={{ textAlign: 'left', width: '270px' }}
                      >
                        {request.text}
                      </span>
                      <div className="w-5" />
                    </div>
                  </div>
                  <hr className="border-1 border-gray-200" />
                </div>
              )
            })}
            {requestList.map((request, index) => {
              return (
                <div key={index}>
                  <div className="flex items-center">
                    <div className="mr-2">
                      {request.status === 'processing' ? (
                        <Processing />
                      ) : (
                        <Complete />
                      )}
                    </div>
                    <div className="flex flex-row justify-between items-center gap-3 w-full">
                      <span
                        className="text-xs flex items-center h-full"
                        style={{ textAlign: 'left', width: '270px' }}
                      >
                        {request.text}
                      </span>
                      <div
                        className="border-green-200 border-2 text-xs w-8 h-5 flex justify-center items-center cursor-pointer"
                        onClick={() => resolveHandler(request.id)}
                      >
                        완료
                      </div>
                    </div>
                  </div>
                  <hr className="border-1 border-gray-200" />
                </div>
              )
            })}
          </div>
          {/*<div*/}
          {/*  className={`flex items-center justify-center mt-5 ${!showRecordInput ? 'pl-12' : 'pl-0'}`}*/}
          {/*>*/}
          {/*  <span>오늘의 기록</span>*/}
          {/*  {showRecordInput && (*/}
          {/*    <div className="flex ml-4 items-center">*/}
          {/*      <span className="w-8 text-xs flex items-center justify-center h-full">*/}
          {/*        골 :*/}
          {/*      </span>*/}
          {/*      <input*/}
          {/*        className="w-12 text-xs border-2 border-amber-100"*/}
          {/*        style={{ textAlign: 'center' }}*/}
          {/*        onChange={scorerHandler}*/}
          {/*      />*/}
          {/*      <span className="w-8 text-xs flex items-center justify-center h-full">*/}
          {/*        어시 :*/}
          {/*      </span>*/}
          {/*      <input*/}
          {/*        className="w-12 text-xs border-2 border-amber-100"*/}
          {/*        style={{ textAlign: 'center' }}*/}
          {/*        onChange={assistantHandler}*/}
          {/*      />*/}
          {/*    </div>*/}
          {/*  )}*/}
          {/*  {!showRecordInput ? (*/}
          {/*    <div*/}
          {/*      className="relative left-16 text-xs border-2 border-indigo-100 cursor-pointer"*/}
          {/*      onClick={() => setShowRecordInput(true)}*/}
          {/*    >*/}
          {/*      기록 추가하기*/}
          {/*    </div>*/}
          {/*  ) : (*/}
          {/*    <div*/}
          {/*      className="ml-2 text-xs border-2 border-indigo-100 cursor-pointer"*/}
          {/*      onClick={() => addRecordHandler()}*/}
          {/*    >*/}
          {/*      추가*/}
          {/*    </div>*/}
          {/*  )}*/}
          {/*</div>*/}
          {/*<RecordBox className="border-2 border-amber-200 mt-2 overflow-y-auto p-1">*/}
          {/*  <div>*/}
          {/*    {todayRecord.map((record, index) => {*/}
          {/*      return (*/}
          {/*        <div key={index}>*/}
          {/*          <div className="flex items-center mb-1 border-b-2 border-b-gray-200 h-10">*/}
          {/*            <div className="flex flex-row justify-between items-center gap-3 w-full">*/}
          {/*              <span className="text-xs">{record.time}</span>*/}
          {/*              <div className="border-r-2 border-r-indigo-300 h-4"></div>*/}
          {/*              <div className="flex">*/}
          {/*                <span className="w-6 text-xs flex items-center justify-center h-full">*/}
          {/*                  골 :*/}
          {/*                </span>*/}
          {/*                <input*/}
          {/*                  className="w-12 text-xs border-2 border-amber-100"*/}
          {/*                  style={{ textAlign: 'center' }}*/}
          {/*                  value={record.goal}*/}
          {/*                  onChange={(e) =>*/}
          {/*                    goalInputChangeHandler(index, e.target.value)*/}
          {/*                  }*/}
          {/*                />*/}
          {/*              </div>*/}
          {/*              <div className="border-r-2 border-r-indigo-300 h-4"></div>*/}
          {/*              <div className="flex">*/}
          {/*                <span className="w-10 text-xs flex items-center  justify-center h-full">*/}
          {/*                  어시 :{' '}*/}
          {/*                </span>*/}
          {/*                <input*/}
          {/*                  className="w-12 text-xs border-2 border-amber-100"*/}
          {/*                  style={{ textAlign: 'center' }}*/}
          {/*                  value={record.assist}*/}
          {/*                  onChange={(e) =>*/}
          {/*                    assistInputChangeHandler(index, e.target.value)*/}
          {/*                  }*/}
          {/*                />*/}
          {/*              </div>*/}
          {/*              <div className="border-r-2 border-r-indigo-300 h-4"></div>*/}
          {/*              <div*/}
          {/*                className="text-xs flex items-center justify-center h-full w-12 border-2 border-indigo-100"*/}
          {/*                onClick={() => updateRecordHandler(record.id)}*/}
          {/*              >*/}
          {/*                수정*/}
          {/*              </div>*/}
          {/*            </div>*/}
          {/*          </div>*/}
          {/*        </div>*/}
          {/*      )*/}
          {/*    })}*/}
          {/*  </div>*/}
          {/*</RecordBox>*/}
        </div>
      )}
    </div>
  )
}

export default AdminPage

const Processing = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid red;
  background-color: red;
`

const Complete = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid green;
  background-color: green;
`

const RecordBox = styled.div`
  height: 70vh;
`
