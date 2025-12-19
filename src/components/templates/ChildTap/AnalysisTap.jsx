import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
import { getDatabase, onValue, ref } from 'firebase/database'

import CloseButton from '@/components/atoms/Button/CloseButton.jsx'

import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'

import left from '@/assets/left.png'
import right from '@/assets/right.png'
import mining from '@/assets/minning.gif'
// import InfiniteCarousel from '@/components//organisms/InfiniteCarousel.jsx'
import TitleHolderCard from '../../organisms/TitleHolderCard.jsx'

const AnalysisTap = (props) => {
  const { test } = props
  const { existingMembers } = getMembers()
  const {
    time: { thisYear },
  } = getTimes()
  const tapList = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const thisMonth = test ? 12 : new Date().getMonth() + 1
  const [quarter, setQuarter] = useState(0)
  const [needMoreData, setNeedMoreData] = useState(false)
  const [thisQuarterData, setThisQuarterData] = useState([])
  const [thisQuarterPlayers, setThisQuarterPlayers] = useState([])
  const [sonKaeDuo, setSonKaeDuo] = useState({})
  const [mostMvpPlayer, setMostMvpPlayer] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [mostPartnerPlayers, setMostPartnerPlayers] = useState({})
  const [mostMercenaryPlayer, setMostMercenaryPlayer] = useState({})
  const [bestEarlyStarter, setBestEarlyStarter] = useState({})
  const [bestSlowStarter, setBestSlowStarter] = useState({})
  const [tenTenClub, setTenTenClub] = useState({})
  const [twentyTwentyClub, setTwentyTwentyClub] = useState({})
  const [greedyPlayer, setGreedyPlayer] = useState({})
  const [altruisticPlayer, setAltruisticPlayer] = useState({})
  const [tap, setTap] = useState(0)
  const [showIndividual, setShowIndividual] = useState(false)

  const tapDataList = [
    mostMvpPlayer,
    tenTenClub,
    twentyTwentyClub,
    bestEarlyStarter,
    bestSlowStarter,
    sonKaeDuo,
    greedyPlayer,
    altruisticPlayer,
    mostPartnerPlayers,
    mostMercenaryPlayer,
  ]

  // 개인별 데이터
  const [thisQuarterMVP, setThisQuarterMVP] = useState([])
  const [thisQuarterPointData, setThisQuarterPointData] = useState(null)
  const [thisQuarterDataByTime, setThisQuarterDataByTime] = useState(null)
  const [thisQuarterMostPartners, setThisQuarterMostPartners] = useState({})
  const [thisQuarterPlayersCombination, setThisQuarterPlayersCombination] =
    useState(null)
  const [mercenaryBring, setMercenaryBring] = useState(null)
  const [integratedData, setIntegratedData] = useState(null)
  const [playerDetail, setPlayerDetail] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    if (thisMonth < 4) {
      setQuarter(1)
    } else if (thisMonth < 7) {
      setQuarter(2)
    } else if (thisMonth < 10) {
      setQuarter(3)
    } else {
      setQuarter(4)
    }
    getRealTimeDatabaseData()
    getDailyMVPData()
    getWeeklyTeamData()
  }, [])

  useEffect(() => {
    // 4주 이상 진행됐을 시
    if (thisQuarterData.length > 2) {
      setNeedMoreData(false)
      const totalData = []
      thisQuarterData.forEach((data) => {
        Object.values(data[1]).forEach((value) => {
          totalData.push(value)
        })
      })
      const resultDuo = [...getSonKaeDuo(totalData)]
      const fullNameDuo = []
      resultDuo.forEach((item) => {
        const temp = []
        let tempObject = {}
        item.key.split('_').forEach((name) => {
          for (let i = 0; i < existingMembers.length; i++) {
            if (existingMembers[i].includes(name)) {
              temp.push(existingMembers[i])
              break
            }
          }
        })
        tempObject = { key: temp[0] + ' - ' + temp[1], count: item.count }
        fullNameDuo.push(tempObject)
      })
      setSonKaeDuo({
        name: [fullNameDuo[0]['key']],
        count: fullNameDuo[0]['count'] + '골',
      })

      // 시간에 따른 포인트 분석 데이터
      const analyzedDataByTime = {}
      const analyzedDataByTimeMap = new Map()
      // 플레이어당 골/어시 데이터
      const pointData = {}
      const pointDataMap = new Map()
      totalData.forEach((item) => {
        if (item.goal !== '용병') {
          // analyzedDataByTime 데이터 넣기
          if (!analyzedDataByTime[item.goal]) {
            analyzedDataByTime[item.goal] = {
              first: Number(item.time.split(':')[0]) < 9 ? 1 : 0,
              second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0,
            }
            analyzedDataByTimeMap.set(item.goal, {
              first: Number(item.time.split(':')[0]) < 9 ? 1 : 0,
              second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0,
            })
          } else {
            if (Number(item.time.split(':')[0]) < 9) {
              analyzedDataByTime[item.goal].first++
              analyzedDataByTimeMap.set(item.goal, {
                first: analyzedDataByTime[item.goal].first + 1,
                second: analyzedDataByTime[item.goal].second,
              })
            } else {
              analyzedDataByTime[item.goal].second++
              analyzedDataByTimeMap.set(item.goal, {
                first: analyzedDataByTime[item.goal].first,
                second: analyzedDataByTime[item.goal].second + 1,
              })
            }
          }

          // pointData 데이터 넣기
          if (!pointData[item.goal]) {
            pointData[item.goal] = { goal: 1, assist: 0 }
            pointDataMap.set(item.goal, { goal: 1, assist: 0 })
          } else {
            pointData[item.goal]['goal']++
            pointDataMap.set(item.goal, {
              goal: pointData[item.goal].goal + 1,
              assist: pointData[item.goal].assist,
            })
          }
        }
        if (item.assist && item.assist !== '용병') {
          // analyzedDataByTime 데이터 넣기
          if (!analyzedDataByTime[item.assist]) {
            analyzedDataByTime[item.assist] = {
              first: Number(item.time.split(':')[0]) < 9 ? 1 : 0,
              second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0,
            }
            analyzedDataByTimeMap.set(item.assist, {
              first: Number(item.time.split(':')[0]) < 9 ? 1 : 0,
              second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0,
            })
          } else {
            if (Number(item.time.split(':')[0]) < 9) {
              analyzedDataByTime[item.assist].first++
              analyzedDataByTimeMap.set(item.assist, {
                first: analyzedDataByTime[item.assist].first + 1,
                second: analyzedDataByTime[item.assist].second,
              })
            } else {
              analyzedDataByTime[item.assist].second++
              analyzedDataByTimeMap.set(item.assist, {
                first: analyzedDataByTime[item.assist].first,
                second: analyzedDataByTime[item.assist].second + 1,
              })
            }
          }

          // pointdata 데이터 넣기
          if (!pointData[item.assist]) {
            pointData[item.assist] = { goal: 0, assist: 1 }
            pointDataMap.set(item.assist, { goal: 0, assist: 1 })
          } else {
            pointData[item.assist]['assist']++
            pointDataMap.set(item.assist, {
              goal: pointData[item.assist].goal,
              assist: pointData[item.assist].assist + 1,
            })
          }
        }
      })
      // 전/후반 비율 계산
      Object.entries(analyzedDataByTime).forEach(([key, value]) => {
        if (value.first > 0 && value.second > 0) {
          const total = value.first + value.second
          value.firstRate = ((value.first / total) * 100).toFixed(3)
          value.secondRate = ((value.second / total) * 100).toFixed(3)
          analyzedDataByTimeMap.set(key, {
            ...value,
            firstRate: value.firstRate,
            secondRate: value.secondRate,
          })
        }
      })
      getEarlyStarter(analyzedDataByTime)
      getSlowStarter(analyzedDataByTime)

      // 골/어시 비율 계산
      Object.entries(pointData).forEach(([key, value]) => {
        const total = value.goal + value.assist
        value.goalRate = ((value.goal / total) * 100).toFixed(3)
        value.assistRate = ((value.assist / total) * 100).toFixed(3)
        pointDataMap.set(key, {
          ...value,
          goalRate: value.goalRate,
          assistRate: value.assistRate,
        })
      })
      getPointClub(pointData)
      getGreedyPlayer(pointData)
      getAltruisticPlayer(pointData)

      setThisQuarterDataByTime(analyzedDataByTimeMap)
      setThisQuarterPointData(pointDataMap)
    } else {
      // 데이터 모으는 중
      setNeedMoreData(true)
    }
  }, [thisQuarterData])

  const getFullName = (name) => {
    for (let i = 0; i < existingMembers.length; i++) {
      if (existingMembers[i].includes(name)) {
        return existingMembers[i]
      }
    }
  }

  // 지난 분기 데이터 or 현재 분기 4주 이상 데이터
  const getRealTimeDatabaseData = async () => {
    const db = getDatabase()
    const todayRef = ref(db, test ? '2024' : thisYear)
    onValue(todayRef, (snapshot) => {
      const data = snapshot.val()
      let filteredData = []
      if (thisMonth < 4) {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (key.length === 4 && Number(key.slice(0, 2)) <= 3) {
            return item
          }
        })
      } else if (thisMonth < 7) {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (
            key.length === 4 &&
            Number(key.slice(0, 2)) > 3 &&
            Number(key.slice(0, 2)) <= 6
          ) {
            return item
          }
        })
      } else if (thisMonth < 10) {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (
            key.length === 4 &&
            Number(key.slice(0, 2)) > 6 &&
            Number(key.slice(0, 2)) <= 9
          ) {
            return item
          }
        })
      } else {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (key.length === 4 && Number(key.slice(0, 2)) > 9) {
            return item
          }
        })
      }
      setThisQuarterData(filteredData)
    })
  }

  const getDailyMVPData = async () => {
    const mvpRef = collection(db, 'daily_mvp')
    const mvpSnapshot = await getDocs(mvpRef)
    const fetchedData = mvpSnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }))

    const filteredData = []
    if (thisMonth < 4) {
      fetchedData.forEach((data) => {
        if (
          thisYear.slice(2, 4) === data.id.slice(0, 2) &&
          data.id.slice(2, 4) <= 3
        ) {
          if (Object.keys(data.data)[0] === 'bestPlayers') {
            data.data['bestPlayers'].forEach((item) => {
              filteredData.push(item.name)
            })
          } else {
            filteredData.push(data.data.name)
          }
        }
      })
    } else if (thisMonth < 7) {
      fetchedData.forEach((data) => {
        if (
          thisYear.slice(2, 4) === data.id.slice(0, 2) &&
          data.id.slice(2, 4) > 3 &&
          data.id.slice(2, 4) <= 6
        ) {
          if (Object.keys(data.data)[0] === 'bestPlayers') {
            data.data['bestPlayers'].forEach((item) => {
              filteredData.push(item.name)
            })
          } else {
            filteredData.push(data.data.name)
          }
        }
      })
    } else if (thisMonth < 10) {
      fetchedData.forEach((data) => {
        if (
          thisYear.slice(2, 4) === data.id.slice(0, 2) &&
          data.id.slice(2, 4) > 6 &&
          data.id.slice(2, 4) <= 9
        ) {
          if (Object.keys(data.data)[0] === 'bestPlayers') {
            data.data['bestPlayers'].forEach((item) => {
              filteredData.push(item.name)
            })
          } else {
            filteredData.push(data.data.name)
          }
        }
      })
    } else {
      fetchedData.filter((data) => {
        if (
          thisYear.slice(2, 4) === data.id.slice(0, 2) &&
          data.id.slice(2, 4) > 9
        ) {
          if (Object.keys(data.data)[0] === 'bestPlayers') {
            data.data['bestPlayers'].forEach((item) => {
              filteredData.push(item.name)
            })
          } else {
            filteredData.push(data.data.name)
          }
        }
      })
    }

    setThisQuarterMVP(filteredData)

    const mvpCount = {}
    filteredData.forEach((data) => {
      if (!mvpCount[data]) {
        mvpCount[data] = { name: data, count: 1 }
      } else {
        mvpCount[data].count += 1
      }
    })

    let count = -1
    let mostMVP = []
    Object.values(mvpCount).forEach((entry) => {
      if (entry.count > count) {
        mostMVP = [entry.name]
        count = entry.count
      } else if (entry.count === count) {
        mostMVP.push(entry.name)
      }
    })
    setMostMvpPlayer({ name: mostMVP, count: count + '회' })
  }

  const getWeeklyTeamData = async () => {
    const weeklyTeamRef = collection(db, 'weeklyTeam')
    const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
    const fetchedData = weeklyTeamSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      .filter((data) => data['id'].slice(0, 2) === thisYear.slice(2, 4))

    const filteredData = []
    if (thisMonth < 4) {
      fetchedData.forEach((data) => {
        if (data.id.slice(2, 4) <= 3) {
          filteredData.push(data.data)
        }
      })
    } else if (thisMonth < 7) {
      fetchedData.forEach((data) => {
        if (data.id.slice(2, 4) > 3 && data.id.slice(2, 4) <= 6) {
          filteredData.push(data.data)
        }
      })
    } else if (thisMonth < 10) {
      fetchedData.forEach((data) => {
        if (data.id.slice(2, 4) > 6 && data.id.slice(2, 4) <= 9) {
          filteredData.push(data.data)
        }
      })
    } else {
      fetchedData.filter((data) => {
        if (data.id.slice(2, 4) > 9) {
          filteredData.push(data.data)
        }
      })
    }

    // 전체 주차 통합
    const totalTeamData = []
    filteredData.forEach((arr) => {
      totalTeamData.push(arr[1])
      totalTeamData.push(arr[2])
      if (arr[3]) {
        totalTeamData.push(arr[3])
      }
    })

    // 플레이어 당 통계
    const playerData = {}
    const mercenary = {}
    const mercenaryMap = new Map()
    let maxMercenaryCount = 0
    totalTeamData.forEach((row) => {
      row.forEach((player) => {
        if (player.includes('용병') && player.length > 2) {
          const bring = player.slice(0, 2)
          if (bring !== '용병') {
            if (!mercenary[bring]) {
              mercenary[bring] = 1
              mercenaryMap.set(bring, { mercenary: 1 })
              if (maxMercenaryCount < 1) {
                maxMercenaryCount = 1
              }
            } else {
              mercenary[bring]++
              mercenaryMap.set(bring, { mercenary: mercenary[bring] })
              if (maxMercenaryCount < mercenary[bring]) {
                maxMercenaryCount = mercenary[bring]
              }
            }
          }
        }
        setMercenaryBring(mercenaryMap)

        if (player && !player.includes('용병')) {
          if (!playerData[player]) {
            playerData[player] = {}
          }
          const exceptSelf = row.filter(
            (name) => ![player, ''].includes(name) && !name.includes('용병'),
          )
          exceptSelf.forEach((name) => {
            if (!playerData[player][name]) {
              playerData[player][name] = 1
            } else {
              playerData[player][name]++
            }
          })
        }
      })
    })

    setWeeklyTeamData(playerData)

    // 이번 분기 플레이어 set
    const members = []
    Object.keys(playerData).forEach((player) => {
      for (let i = 0; i < existingMembers.length; i++) {
        if (existingMembers[i].includes(player)) {
          members.push(existingMembers[i])
          break
        }
      }
    })
    members.sort()
    setThisQuarterPlayers(members)

    // 용병 최다 횟수 인원 1명이면 set
    const temp = []
    delete mercenary['용병']
    Object.entries(mercenary).forEach(([key, value]) => {
      if (value === maxMercenaryCount) {
        temp.push(key)
      }
    })
    let resultPlayer = ''
    if (temp.length === 1) {
      const fullName = getFullName(temp[0])
      setMostMercenaryPlayer({
        name: [fullName],
        count: maxMercenaryCount + '회',
      })
    }
  }

  const getSonKaeDuo = (totalData) => {
    // 최다 골 합작
    const combinations = {}
    const combinationMap = new Map()
    totalData.forEach((item) => {
      if (
        item.goal &&
        item.assist &&
        item.goal !== '용병' &&
        item.assist !== '용병'
      ) {
        const sortedKey = [item.goal, item.assist].sort()
        const key = `${sortedKey[0]}_${sortedKey[1]}`
        if (!combinations[key]) {
          combinations[key] = { key: key, count: 0 }
          combinationMap.set(key, 0)
        }
        combinations[key].count++
        combinationMap.set(key, combinationMap.get(key) + 1)
      }
    })
    setThisQuarterPlayersCombination(combinationMap)

    let count = -1
    let maxCombination = []
    const combinationArray = [...Object.values(combinations)]
    combinationArray.forEach((combination) => {
      if (combination.count >= count) {
        maxCombination.push(combination)
        count = combination.count
      }
    })
    maxCombination = maxCombination.filter(
      (combination) => combination.count === count,
    )
    return maxCombination
  }

  const getEarlyStarter = (analyzedData) => {
    const bestEarlyStarterArray = []
    let maxRate = 0
    Object.values(analyzedData).forEach((value) => {
      if (value.firstRate) {
        if (maxRate < value.firstRate) {
          maxRate = value.firstRate
        }
      }
    })
    Object.entries(analyzedData).forEach(([key, value]) => {
      if (value.firstRate === maxRate) {
        bestEarlyStarterArray.push(key)
      }
    })
    if (bestEarlyStarterArray.length === 1) {
      setBestEarlyStarter({ name: [getFullName(bestEarlyStarterArray[0])] })
    }
  }

  const getSlowStarter = (analyzedData) => {
    const bestSlowStarterArray = []
    let maxRate = 0
    Object.values(analyzedData).forEach((value) => {
      if (value.secondRate) {
        if (maxRate < value.secondRate) {
          maxRate = value.secondRate
        }
      }
    })
    Object.entries(analyzedData).forEach(([key, value]) => {
      if (value.secondRate === maxRate) {
        bestSlowStarterArray.push(key)
      }
    })
    if (bestSlowStarterArray.length === 1) {
      setBestSlowStarter({ name: [getFullName(bestSlowStarterArray[0])] })
    }
  }

  const getPointClub = (pointData) => {
    const tenObject = {}
    const twentyObject = {}
    const almostTenTen = Object.entries(pointData).filter(
      ([_, { goal, assist }]) =>
        ((goal >= 10 || assist >= 10) &&
          goal >= 7 &&
          assist >= 7 &&
          (goal < 10 || assist < 10)) ||
        (goal < 10 && assist < 10 && goal + assist > 16),
    )
    const almostTwentyTwenty = Object.entries(pointData).filter(
      ([_, { goal, assist }]) =>
        (goal >= 20 || assist >= 20) &&
        goal >= 17 &&
        assist >= 17 &&
        (goal < 20 || assist < 20),
    )
    const tenTen = Object.entries(pointData).filter(
      ([_, value]) => value.goal >= 10 && value.assist >= 10,
    )
    const twentyTwenty = Object.entries(pointData).filter(
      ([_, value]) => value.goal >= 20 && value.assist >= 20,
    )

    // setTenTenClub
    if (tenTen.length > 0) {
      const temp = []
      tenTen.forEach((name) => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      tenObject['name'] = temp
    }

    // setAlmostTenTenClub
    if (almostTenTen.length > 0) {
      const temp = []
      almostTenTen.forEach((name) => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      tenObject['additional'] = temp
    }

    // setTwentyTwentyClub
    if (twentyTwenty.length > 0) {
      const temp = []
      twentyTwenty.forEach((name) => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      twentyObject['name'] = temp
    }

    // setAlmostTwentyTwentyClub
    if (almostTwentyTwenty.length > 0) {
      const temp = []
      almostTwentyTwenty.forEach((name) => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      twentyObject['additional'] = temp
    }

    setTenTenClub(tenObject)
    setTwentyTwentyClub(twentyObject)
  }

  const getGreedyPlayer = (pointData) => {
    const greedy = []
    let maxGreedyRate = 0
    const epsilon = 0.001
    Object.values(pointData).forEach((value) => {
      if (value.goalRate - maxGreedyRate > epsilon) {
        maxGreedyRate = value.goalRate
      }
    })
    Object.entries(pointData).forEach(([key, value]) => {
      if (value.goalRate === maxGreedyRate) {
        const fullName = getFullName(key)
        if (fullName) {
          greedy.push(fullName)
        }
      }
    })
    setGreedyPlayer({ name: greedy, count: Math.round(maxGreedyRate) + '%' })
  }

  const getAltruisticPlayer = (pointData) => {
    const altruistic = []
    let maxAltruisticRate = 0
    const epsilon = 0.001
    Object.values(pointData).forEach((value) => {
      if (value.assistRate - maxAltruisticRate > epsilon) {
        maxAltruisticRate = value.assistRate
      }
    })
    Object.entries(pointData).forEach(([key, value]) => {
      if (value.assistRate === maxAltruisticRate) {
        const fullName = getFullName(key)
        if (fullName) {
          altruistic.push(fullName)
        }
      }
    })
    setAltruisticPlayer({
      name: altruistic,
      count: Math.round(maxAltruisticRate) + '%',
    })
  }

  const getMostPartner = (data) => {
    const mostPartners = {}
    let maxCount = -1
    Object.entries(data).forEach(([key, value]) => {
      let count = -1
      Object.values(value).forEach((num) => {
        if (maxCount < num) {
          maxCount = num
        }
        if (count < num) {
          count = num
        }
      })
      let mostPartner = Object.entries(value)
        .filter(([partner, num]) => num === count)
        .map((arr) => arr[0])
      mostPartners[key] = { name: mostPartner, count: count }
    })
    setThisQuarterMostPartners(mostPartners)

    const maxCountPlayer = []
    Object.entries(mostPartners).forEach(([key, value]) => {
      if (value.count === maxCount && value.name.length === 1) {
        const tempArray = [key, value.name[0]].sort()
        const comb = tempArray[0] + '_' + tempArray[1]
        if (!maxCountPlayer.includes(comb)) {
          maxCountPlayer.push(comb)
        }
      }
    })
    if (maxCountPlayer.length === 1) {
      const fullName = []
      maxCountPlayer[0].split('_').forEach((name) => {
        existingMembers.forEach((player) => {
          if (player.includes(name)) {
            fullName.push(player)
          }
        })
      })
      setMostPartnerPlayers({
        name: [fullName[0] + ' - ' + fullName[1]],
        count: maxCount + '회',
      })
    }
  }

  useEffect(() => {
    if (weeklyTeamData) {
      getMostPartner(weeklyTeamData)
    }
  }, [weeklyTeamData])

  useEffect(() => {
    if (
      thisQuarterPlayers.length > 0 &&
      thisQuarterPointData?.size > 0 &&
      thisQuarterDataByTime?.size > 0 &&
      Object.keys(thisQuarterMostPartners).length > 0 &&
      thisQuarterMVP.length > 0 &&
      thisQuarterPlayersCombination?.size > 0
    ) {
      const integratedMap = new Map()
      thisQuarterPointData.forEach((value, key) => {
        integratedMap.set(key, {
          ...value,
          ...thisQuarterDataByTime.get(key),
          ...thisQuarterMostPartners[key],
          ...mercenaryBring.get(key),
        })
      })

      setIntegratedData(integratedMap)
    }
  }, [
    thisQuarterPlayers,
    thisQuarterDataByTime,
    thisQuarterMostPartners,
    thisQuarterPointData,
    thisQuarterMVP,
    mercenaryBring,
    thisQuarterPlayersCombination,
  ])

  const playerDetailHandler = (name) => {
    const detailMap = integratedData.get(name.slice(1, 3))
    if (detailMap) {
      const detail = {
        name: name,
        mostPartner: detailMap.name,
        mostPartnerCount: detailMap.count,
        style: [],
        mvp: 0,
        mercenary: detailMap.mercenary ? detailMap.mercenary : 0,
      }
      // play style
      if (detailMap.goal > detailMap.assist) {
        detail['style'].push('개인적')
      } else if (detailMap.goal < detailMap.assist) {
        detail['style'].push('이타적')
      }
      if (detailMap.first > detailMap.second) {
        detail['style'].push('얼리스타터')
      } else if (detailMap.first < detailMap.second) {
        detail['style'].push('슬로우스타터')
      }
      // mvp count
      let mvpCount = 0
      thisQuarterMVP.forEach((mvp) => {
        if (mvp && mvp.includes(name)) {
          mvpCount += 1
        }
      })
      detail['mvp'] = mvpCount
      // combination
      const combi = []
      let maxPoint = 0
      thisQuarterPlayersCombination.forEach((value, key) => {
        if (key.includes(name.slice(1, 3))) {
          const temp = key.split('_')
          if (temp[0] !== name.slice(1, 3)) {
            combi.push([temp[0], value])
          }
          if (temp[1] !== name.slice(1, 3)) {
            combi.push([temp[1], value])
          }
          if (value > maxPoint) {
            maxPoint = value
          }
        }
      })
      const maxCombi = []
      combi.forEach((item) => {
        if (item[1] === maxPoint) {
          maxCombi.push(item[0])
        }
      })
      detail['combi'] = maxCombi
      detail['combiCount'] = maxPoint
      setPlayerDetail(detail)
    } else {
      const detail = {
        name: name,
        description: '경기 데이터가 없습니다.',
      }
      setPlayerDetail(detail)
    }
    setShowDetail(true)
  }

  const tapHandler = (where) => {
    if (where === 'left') {
      const newTap = tap - 1
      if (newTap < 0) {
        setTap(tapList.length - 1)
      } else {
        setTap(newTap)
      }
    } else {
      const newTap = tap + 1
      if (newTap > tapList.length - 1) {
        setTap(0)
      } else {
        setTap(newTap)
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="mt-5 mb-5 text-sm">
        {thisYear} - 제 {quarter} 시즌
      </h2>
      {needMoreData && !test && (
        <div className="flex flex-col gap-3 items-center">
          <span className="text-xl">데이터를 모으는 중 입니다</span>
          <Mining />
          <span className="text-sm">
            4주 이상의 데이터 필요.. ({thisQuarterData.length}/4)
          </span>
        </div>
      )}
      {!needMoreData && (
        <div
          className="relative top-1"
          style={{ width: '100%', top: '22vh', left: '5px' }}
        >
          <Arrow $direction={'left'} onClick={() => tapHandler('left')} />
          <Arrow $direction={'right'} onClick={() => tapHandler('right')} />
        </div>
      )}
      {test && (
        <div
          className="relative top-1"
          style={{ width: '100%', top: '22vh', left: '5px' }}
        >
          <Arrow $direction={'left'} onClick={() => tapHandler('left')} />
          <Arrow $direction={'right'} onClick={() => tapHandler('right')} />
        </div>
      )}
      {!needMoreData && (
        <TitleHolderCard key={tap} tapNumber={tap} data={tapDataList[tap]} />
      )}
      {!needMoreData && (
        <>
          {showIndividual ? (
            <div className="absolute bottom-0 flex flex-col items-end z-[2]">
              <CloseButton
                clickHandler={() => setShowIndividual(false)}
                customStyle="relative w-[30px] right-0"
              />
              <PlayersBox
                className="flex gap-5 flex-wrap relative bottom-0 justify-center overflow-y-auto bg-white border-t-2 border-t-gray-200 border-b-2 border-b-gray-200"
                $showDetail={showDetail}
              >
                {!showDetail &&
                  thisQuarterPlayers.map((player) => (
                    <ActivePlayer
                      key={player}
                      className="text-green-900 cursor-pointer"
                      onClick={() => playerDetailHandler(player)}
                    >
                      {player}
                    </ActivePlayer>
                  ))}
                {showDetail && (
                  <div>
                    <div className="flex flex-col">
                      <ActivePlayer className="underline decoration-2 decoration-solid decoration-yellow-400 text-blue-800 mb-2">
                        {playerDetail['name']}
                      </ActivePlayer>
                      {playerDetail['description'] ? (
                        <span>{playerDetail['description']}</span>
                      ) : (
                        <div>
                          <ListBody>
                            <ListTitle>MVP</ListTitle>
                            <span className="text-black">
                              {' '}
                              {playerDetail['mvp'] + '회'}
                            </span>
                          </ListBody>
                          <ListBody>
                            <ListTitle>최다 골 합작</ListTitle>
                            <span className="text-black">
                              {' '}
                              {playerDetail['combi'].map((name) => (
                                <span key={name} style={{ marginRight: '3px' }}>
                                  {name}
                                </span>
                              ))}
                              , {playerDetail['combiCount']}골
                            </span>
                          </ListBody>
                          <ListBody>
                            <ListTitle>최다 같은 팀</ListTitle>
                            <span className="text-black">
                              {' '}
                              {playerDetail['mostPartner'].map((name) => (
                                <span key={name} style={{ marginRight: '3px' }}>
                                  {name}
                                </span>
                              ))}
                              , {playerDetail['mostPartnerCount']}회
                            </span>
                          </ListBody>
                          <ListBody>
                            <ListTitle>용병 호출</ListTitle>
                            <span className="text-black">
                              {' '}
                              {playerDetail['mercenary']}회
                            </span>
                          </ListBody>
                          <ListBody>
                            <ListTitle>스타일</ListTitle>
                            <span className="text-black">
                              {' '}
                              {playerDetail['style'].map((style) => (
                                <span
                                  key={style}
                                  style={{ marginRight: '5px' }}
                                >
                                  #{style}
                                </span>
                              ))}
                            </span>
                          </ListBody>
                        </div>
                      )}
                    </div>
                    <Close
                      className="cursor-pointer text-sm text-black"
                      onClick={() => setShowDetail(false)}
                    >
                      back
                    </Close>
                  </div>
                )}
              </PlayersBox>
            </div>
          ) : (
            <div
              className="absolute z-10 bottom-[7vh] right-[30px]"
              onClick={() => setShowIndividual(true)}
            >
              <div className="relative z-20 border-double border-0 border-b-2 border-t-2 border-blue-600">
                <span className="text-[17px] text-goal">개인별</span>
              </div>
              <div className="opacity-50 absolute z-10 -top-[1.60rem] -right-4 bg-football w-20 h-20 bg-[length:100%_100%] bg-no-repeat bg-center animate-spinSlow" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AnalysisTap

const Mining = styled.div`
  background: url(${mining}) no-repeat center center;
  background-size: 100% 100%;
  width: 300px;
  height: 300px;
`

const Arrow = styled.div`
  z-index: 10;
  position: absolute;
  right: ${(props) => props.$direction === 'right' && '-15px'};
  background: ${(props) =>
    props.$direction === 'right'
      ? `url(${right}) no-repeat center center`
      : `url(${left}) no-repeat center center`};
  background-size: 100% 100%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  @media (max-width: 812px) {
    width: 50px;
    height: 50px;
  }
  @media (prefers-color-scheme: dark) {
    filter: invert(1);
  }
`

const ActivePlayer = styled.span`
  @media (prefers-color-scheme: dark) {
    color: #1d4ed8;
  }
`

const PlayersBox = styled.div`
  filter: ${(props) => !props.$showDetail && 'drop-shadow(2px 0px 6px gray)'};
  padding: ${(props) =>
    !props.$showDetail ? '10px 20px 5px 20px' : '10xp 10px 5px 10px'};
  height: 160px;
`

const Close = styled.div`
  position: absolute;
  right: 2px;
  top: 0;
`

const ListTitle = styled.div`
  min-width: 73px;
  width: 73px;
  font-size: 14px;
  margin-right: 12px;
  text-align: right;
  color: black;
`

const ListBody = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-bottom: 3px;
`
