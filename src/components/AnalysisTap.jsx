import {useEffect, useState} from "react"
import {db} from "../../firebase.js"
import {collection, getDocs} from "firebase/firestore";
import {getDatabase, onValue, ref} from "firebase/database";
import styled from 'styled-components'
import left from '@/assets/left.png'
import right from '@/assets/right.png'
import laurel from '@/assets/laurel.png'
import ten from '@/assets/ten.png'
import twenty from '@/assets/twenty.png'
import early from '@/assets/early.png'
import slow from '@/assets/slow.jpg'
import sonkae from '@/assets/sonkae.png'
import greedy from '@/assets/greedy2.png'
import altruistic from '@/assets/altruistic2.png'
import duo from '@/assets/duo.png'
import friend from '@/assets/friend2.png'
import mining from '@/assets/minning.gif'

const AnalysisTap = () => {
  const players = ['홍원진', '우장식', '임희재', '윤희철', '김동휘', '이승호', '임건휘', '방승진', '김민관', '김규진', '임준휘', '전희종', '한상태', '임종우', '노태훈', '윤영진', '이원효', '황정민', '양대열', '정우진', '김남구', '박근한', '손지원', '황철민', '최봉호', '선민조', '최수혁', '김병일', '김대건', '전의준', '황은집', '진장용', '이진헌', '윤준석', '김동주', '선우용', '이재진', '김성록', '박남호', '안용현', '장성민', '하민수']
  const year = '2024'
  const tapList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const tapImage = [laurel, ten, twenty, early, slow, sonkae, greedy, altruistic, duo, friend]
  const tapImageSize = [[170, 170], [100, 100], [100, 100], [150, 150], [152, 150], [250, 150], [150, 160], [150, 150], [100, 100], [170, 170]]
  const thisMonth = new Date().getMonth() + 1
  const [quarter, setQuarter] = useState(0)
  const [needMoreData, setNeedMoreData] = useState(false)
  const [thisQuarterData, setThisQuarterData] = useState([])
  const [thisQuarterPlayers, setThisQuarterPlayers] = useState([])
  const [sonKaeDuo, setSonKaeDuo] = useState([])
  const [mostMvpPlayer, setMostMvpPlayer] = useState([])
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [mostPartnerPlayers, setMostPartnerPlayers] = useState('')
  const [mostMercenaryPlayer, setMostMercenaryPlayer] = useState('')
  const [bestEarlyStarter, setBestEarlyStarter] = useState('')
  const [bestSlowStarter, setBestSlowStarter] = useState('')
  const [tenTenClub, setTenTenClub] = useState([])
  const [twentyTwentyClub, setTwentyTwentyClub] = useState([])
  const [greedyPlayer, setGreedyPlayer] = useState([])
  const [altruisticPlayer, setAltruisticPlayer] = useState([])
  const [tap, setTap] = useState(0)
  // 개인별 데이터
  const [thisQuarterMVP, setThisQuarterMVP] = useState([])
  const [thisQuarterPointData, setThisQuarterPointData] = useState(null)
  const [thisQuarterDataByTime, setThisQuarterDataByTime] = useState(null)
  const [thisQuarterMostPartners, setThisQuarterMostPartners] = useState({})
  const [thisQuarterPlayersCombination, setThisQuarterPlayersCombination] = useState(null)
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
    if (thisQuarterData.length > 3) {
      setNeedMoreData(false)
      const totalData = []
      thisQuarterData.forEach(data => {
        Object.values(data[1]).forEach(value => {
          totalData.push(value)
        })
      })
      const resultDuo = [...getSonKaeDuo(totalData)]
      const fullNameDuo = []
      resultDuo.forEach(item => {
        const temp = []
        let tempObject = {}
        item.key.split('_').forEach(name => {
          for (let i = 0; i < players.length; i++) {
            if (players[i].includes(name)) {
              temp.push(players[i])
              break;
            }
          }
        })
        tempObject = {key: temp[0] + '_' + temp[1], count: item.count}
        fullNameDuo.push(tempObject)
      })
      setSonKaeDuo(fullNameDuo)

      // 시간에 따른 포인트 분석 데이터
      const analyzedDataByTime = {}
      const analyzedDataByTimeMap = new Map()
      // 플레이어당 골/어시 데이터
      const pointData = {}
      const pointDataMap = new Map()
      totalData.forEach(item => {
        if (item.goal !== '용병') {
          // analyzedDataByTime 데이터 넣기
          if (!analyzedDataByTime[item.goal]) {
            analyzedDataByTime[item.goal] = {first: Number(item.time.split(':')[0]) < 9 ? 1 : 0, second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0}
            analyzedDataByTimeMap.set(item.goal, {first: Number(item.time.split(':')[0]) < 9 ? 1 : 0, second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0})
          } else {
            if (Number(item.time.split(':')[0]) < 9) {
              analyzedDataByTime[item.goal].first++
              analyzedDataByTimeMap.set(item.goal, {first: analyzedDataByTime[item.goal].first + 1, second: analyzedDataByTime[item.goal].second})
            } else {
              analyzedDataByTime[item.goal].second++
              analyzedDataByTimeMap.set(item.goal, {first: analyzedDataByTime[item.goal].first, second: analyzedDataByTime[item.goal].second + 1})
            }
          }

          // pointData 데이터 넣기
          if (!pointData[item.goal]) {
            pointData[item.goal] = {goal: 1, assist: 0}
            pointDataMap.set(item.goal, {goal: 1, assist: 0})
          } else {
            pointData[item.goal]['goal'] ++
            pointDataMap.set(item.goal, {goal: pointData[item.goal].goal + 1, assist: pointData[item.goal].assist})
          }
        }
        if (item.assist && item.assist !== '용병') {
          // analyzedDataByTime 데이터 넣기
          if (!analyzedDataByTime[item.assist]) {
            analyzedDataByTime[item.assist] = {first: Number(item.time.split(':')[0]) < 9 ? 1 : 0, second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0}
            analyzedDataByTimeMap.set(item.assist, {first: Number(item.time.split(':')[0]) < 9 ? 1 : 0, second: Number(item.time.split(':')[0]) >= 9 ? 1 : 0})
          } else {
            if (Number(item.time.split(':')[0]) < 9) {
              analyzedDataByTime[item.assist].first++
              analyzedDataByTimeMap.set(item.assist, {first: analyzedDataByTime[item.assist].first + 1, second: analyzedDataByTime[item.assist].second})
            } else {
              analyzedDataByTime[item.assist].second++
                analyzedDataByTimeMap.set(item.assist, {first: analyzedDataByTime[item.assist].first, second: analyzedDataByTime[item.assist].second + 1})
            }
          }

          // pointdata 데이터 넣기
          if (!pointData[item.assist]) {
            pointData[item.assist] = {goal: 0, assist: 1}
            pointDataMap.set(item.assist, {goal: 0, assist: 1})
          } else {
            pointData[item.assist]['assist'] ++
            pointDataMap.set(item.assist, {goal: pointData[item.assist].goal, assist: pointData[item.assist].assist + 1})
          }
        }
      })
      // 전/후반 비율 계산
      Object.entries(analyzedDataByTime).forEach(([key, value]) => {
        if (value.first > 0 && value.second > 0) {
          const total = value.first + value.second
          value.firstRate = (value.first / total * 100).toFixed(3)
          value.secondRate = (value.second / total * 100).toFixed(3)
          analyzedDataByTimeMap.set(key, {...value, firstRate: value.firstRate, secondRate: value.secondRate})
        }
      })
      getEarlyStarter(analyzedDataByTime)
      getSlowStarter(analyzedDataByTime)

      // 골/어시 비율 계산
      Object.entries(pointData).forEach(([key, value]) => {
        const total = value.goal + value.assist
        value.goalRate = (value.goal / total * 100).toFixed(3)
        value.assistRate = (value.assist / total * 100).toFixed(3)
        pointDataMap.set(key, {...value, goalRate: value.goalRate, assistRate: value.assistRate})
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
    for (let i = 0; i < players.length; i++) {
      if (players[i].includes(name)) {
        return players[i]
      }
    }
  }

  // 지난 분기 데이터 or 현재 분기 4주 이상 데이터
  const getRealTimeDatabaseData = async () => {
    const db = getDatabase()
    const todayRef = ref(db, year + '/')
    onValue(todayRef, (snapshot) => {
      const data = snapshot.val()
      let filteredData = []
      if (thisMonth < 4) {
        filteredData = Object.entries(data).filter((key, item) => {
          if (key.length === 4 && Number(key.slice(0, 2)) <= 3) {
            return item
          }
        })
      } else if (thisMonth < 7) {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (key.length === 4 && Number(key.slice(0, 2)) > 3 && Number(key.slice(0, 2)) <= 6) {
            return item
          }
        })
      } else if (thisMonth < 10) {
        filteredData = Object.entries(data).filter(([key, item]) => {
          if (key.length === 4 && Number(key.slice(0, 2)) > 6 && Number(key.slice(0, 2)) <= 9) {
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
    const fetchedData = mvpSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))

    const filteredData = []
    if (thisMonth < 4) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) <= 3) {
          filteredData.push(data.data.name)
        }
      })
    } else if (thisMonth < 7) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) > 3 && data.id.slice(0, 2) <= 6) {
          filteredData.push(data.data.name)
        }
      })
    } else if (thisMonth < 10) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) > 6 && data.id.slice(0, 2) <= 9) {
          filteredData.push(data.data.name)
        }
      })
    } else {
      fetchedData.filter(data => {
        if (data.id.slice(0, 2) > 9) {
          filteredData.push(data.data.name)
        }
      })
    }

    setThisQuarterMVP(filteredData)

    const mvpCount = {}
    filteredData.forEach(data => {
      if (!mvpCount[data]) {
        mvpCount[data] = {name: data, count: 1}
      } else {
        mvpCount[data].count += 1
      }
    })

    let count = -1
    let mostMVP = []
    Object.values(mvpCount).forEach(name => {
      if (name.count >= count) {
        mostMVP.push(name)
        count = name.count
      }
    })
    mostMVP = mostMVP.filter(combination => combination.count === count)
    setMostMvpPlayer(mostMVP)
  }

  const getWeeklyTeamData = async () => {
    const weeklyTeamRef = collection(db, 'weeklyTeam')
    const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
    const fetchedData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))

    const filteredData = []
    if (thisMonth < 4) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) <= 3) {
          filteredData.push(data.data)
        }
      })
    } else if (thisMonth < 7) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) > 3 && data.id.slice(0, 2) <= 6) {
          filteredData.push(data.data)
        }
      })
    } else if (thisMonth < 10) {
      fetchedData.forEach(data => {
        if (data.id.slice(0, 2) > 6 && data.id.slice(0, 2) <= 9) {
          filteredData.push(data.data)
        }
      })
    } else {
      fetchedData.filter(data => {
        if (data.id.slice(0, 2) > 9) {
          filteredData.push(data.data)
        }
      })
    }

    // 전체 주차 통합
    const totalTeamData = []
    filteredData.forEach(arr => {
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
    totalTeamData.forEach(row => {
      row.forEach(player => {
        if (player.includes('용병') && player.length > 2) {
          const bring = player.slice(0, 2)
          if (!mercenary[bring]) {
            mercenary[bring] = 1
            mercenaryMap.set(bring, {mercenary: 1})
            if (maxMercenaryCount < 1) {
              maxMercenaryCount = 1
            }
          } else {
            mercenary[bring]++
            mercenaryMap.set(bring, {mercenary: mercenary[bring]})
            if (maxMercenaryCount < mercenary[bring]) {
              maxMercenaryCount = mercenary[bring]
            }
          }
        }
        setMercenaryBring(mercenaryMap)

        if (player && !player.includes('용병')) {
          if (!playerData[player]) {
            playerData[player] = {}
          }
          const exceptSelf = row.filter(name => ![player, ''].includes(name) && !name.includes('용병'))
          exceptSelf.forEach(name => {
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
    Object.keys(playerData).forEach(player => {
      for (let i = 0; i < players.length; i++) {
        if (players[i].includes(player)) {
          members.push(players[i])
          break
        }
      }
    })
    members.sort()
    setThisQuarterPlayers(members)

    // 용병 최다 횟수 인원 1명이면 set
    const temp = []
    Object.entries(mercenary).forEach(([key, value]) => {
      if (value === maxMercenaryCount) {
        temp.push(key)
      }
    })
    let resultPlayer = ''
    if (temp.length === 1) {
      const fullName = getFullName(temp[0])
      resultPlayer = fullName + '_' + maxMercenaryCount
      setMostMercenaryPlayer(resultPlayer)
    }
  }

  const getSonKaeDuo = (totalData) => {
    // 최다 골 합작
    const combinations = {}
    const combinationMap = new Map()
    totalData.forEach(item => {
      if (item.goal && item.assist && item.goal !== '용병' && item.assist !== '용병') {
        const sortedKey = [item.goal, item.assist].sort()
        const key = `${sortedKey[0]}_${sortedKey[1]}`
        if (!combinations[key]) {
          combinations[key] = { key: key, count: 0 }
          combinationMap.set(key, 0)
        }
        combinations[key].count++
        combinationMap.set(key, combinationMap.get(key) + 1)
      }
    });
    setThisQuarterPlayersCombination(combinationMap)

    let count = -1
    let maxCombination = []
    const combinationArray = [...Object.values(combinations)]
    combinationArray.forEach(combination => {
      if (combination.count >= count) {
        maxCombination.push(combination)
        count = combination.count
      }
    })
    maxCombination = maxCombination.filter(combination => combination.count === count)
    return maxCombination
  }

  const getEarlyStarter = (analyzedData) => {
    const bestEarlyStarterArray = []
    let maxRate = 0
    Object.values(analyzedData).forEach(value => {
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
      setBestEarlyStarter(getFullName(bestEarlyStarterArray[0]))
    }
  }

  const getSlowStarter = (analyzedData) => {
    const bestSlowStarterArray = []
    let maxRate = 0
    Object.values(analyzedData).forEach(value => {
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
      setBestSlowStarter(getFullName(bestSlowStarterArray[0]))
    }
  }

  const getPointClub = (pointData) => {
    const tenTen = Object.entries(pointData).filter(([key, value]) => value.goal >= 10 && value.assist >= 10)
    const twentyTwenty = Object.entries(pointData).filter(([key, value]) => value.goal >= 20 && value.assist >= 20)

    // setTenTenClub
    if (tenTen.length > 0) {
      const temp = []
      tenTen.forEach(name => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      setTenTenClub(temp)
    }

    // setTwentyTwentyClub
    if (twentyTwenty.length > 0) {
      const temp = []
      twentyTwenty.forEach(name => {
        const fullName = getFullName(name[0])
        temp.push(fullName)
      })
      setTwentyTwentyClub(temp)
    }
  }

  const getGreedyPlayer = (pointData) => {
    const greedy = []
    let maxGreedyRate = 0
    const epsilon = 0.001
    Object.values(pointData).forEach(value => {
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
    setGreedyPlayer(greedy)
  }

  const getAltruisticPlayer = (pointData) => {
    const altruistic = []
    let maxAltruisticRate = 0
    const epsilon = 0.001
    Object.values(pointData).forEach(value => {
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
    setAltruisticPlayer(altruistic)
  }

  const getMostPartner = (data) => {
    const mostPartners = {}
    let maxCount = -1
    Object.entries(data).forEach(([key, value]) => {
      let count = -1
      Object.values(value).forEach(num => {
        if (maxCount < num) {
          maxCount = num
        }
        if (count < num) {
          count = num
        }
      })
      let mostPartner = Object.entries(value).filter(([partner, num]) => num === count).map(arr => arr[0])
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
      maxCountPlayer[0].split('_').forEach(name => {
        players.forEach(player => {
          if (player.includes(name)) {
            fullName.push(player)
          }
        })
      })
      setMostPartnerPlayers(fullName[0] + '_' + fullName[1] + '_' + maxCount)
    }
  }

  useEffect(() => {
    if (weeklyTeamData) {
      getMostPartner(weeklyTeamData)
    }
  }, [weeklyTeamData]);

  useEffect(() => {
    if (thisQuarterPlayers.length > 0 && thisQuarterPointData.size > 0 && thisQuarterDataByTime.size > 0 && Object.keys(thisQuarterMostPartners).length > 0 && thisQuarterMVP.length > 0 && thisQuarterPlayersCombination.size > 0) {
      const integratedMap = new Map()
      thisQuarterPointData.forEach((value, key) => {
        integratedMap.set(key, { ...value, ...thisQuarterDataByTime.get(key), ...thisQuarterMostPartners[key], ...mercenaryBring.get(key)})
      })

      setIntegratedData(integratedMap)
    }

  }, [thisQuarterPlayers, thisQuarterDataByTime, thisQuarterMostPartners, thisQuarterPointData, thisQuarterMVP, mercenaryBring, thisQuarterPlayersCombination])

  const playerDetailHandler = (name) => {
    const detailMap = integratedData.get(name.slice(1, 3))
    console.log(detailMap)
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
      thisQuarterMVP.forEach(mvp => {
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
      combi.forEach(item => {
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
    <div className='flex flex-col items-center'>
      <h2 className='mt-5 mb-5 text-sm'>{year} - 제 {quarter} 시즌</h2>
      {needMoreData &&
        <div className='flex flex-col gap-3 items-center'>
          <span className='text-xl'>데이터를 모으는 중 입니다</span>
          <Mining />
          <span className='text-sm'>최소 4주 이상의 데이터 필요 ({thisQuarterData.length}/4)</span>
        </div>
      }
      {!needMoreData &&
        <div className='relative top-1' style={{width: '300px', top: '-1px'}}>
          <Arrow $direction={'left'} onClick={() => tapHandler('left')}/>
          <Arrow $direction={'right'} onClick={() => tapHandler('right')}/>
        </div>
      }
      {!needMoreData &&
        <>
        {// 최다 MVP
          tap === 0 &&
          <div className='flex flex-col gap-1'>
            <Title className='text-xl'>최다 MVP</Title>
            <SubTitle className=''>데일리 MVP 최다 플레이어</SubTitle>
            {mostMvpPlayer.map(player => <PlayerName key={player.name} className='text-xl text-green-800 relative' style={{top: '35px'}}>{player.name}</PlayerName>)}
            <PlayerName style={{top: '100px'}}>{mostMvpPlayer.length > 0 && mostMvpPlayer[0].count}회</PlayerName>
          </div>
        }
        {// 10-10 클럽
          tap === 1 &&
            <div className='flex flex-col gap-1'>
              <Title className='text-xl'>10-10 클럽</Title>
              <SubTitle className=''>골, 어시 각각 10개 이상 달성한 플레이어</SubTitle>
              {tenTenClub?.map(player => <PlayerName key={player} className='text-xl text-green-800' style={{top: '50px'}}>{player}</PlayerName>)}
              {/*<PlayerName className='text-xl text-green-800' style={{top: '50px'}}>{'이승호'}</PlayerName>*/}
              {/*<PlayerName className='text-xl text-green-800' style={{top: '50px'}}>{'이승호'}</PlayerName>*/}
              {tenTenClub.length === 0 && <PlayerName style={{top: '120px'}}>아직 달성한 플레이어가 없습니다</PlayerName>}
            </div>
      }
      {// 20-20 클럽
        tap === 2 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>20-20 클럽</Title>
          <SubTitle className=''>골, 어시 각각 20개 이상 달성한 플레이어</SubTitle>
          {twentyTwentyClub?.map(player => <PlayerName key={player} className='text-xl text-green-800'>{player}</PlayerName>)}
          {/*<PlayerName className='text-xl text-green-800' style={{top: '50px'}}>{'이승호'}</PlayerName>*/}
          {/*<PlayerName className='text-xl text-green-800' style={{top: '50px'}}>{'이승호'}</PlayerName>*/}
          {twentyTwentyClub.length === 0 && <PlayerName style={{top: '120px'}}>아직 달성한 플레이어가 없습니다</PlayerName>}
        </div>
      }
      {// Best 얼리 스타터
        tap === 3 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>Best 얼리 스타터</Title>
          <SubTitle className=''>전반에 포인트 기록한 비율이 가장 높은 플레이어</SubTitle>
          {bestEarlyStarter && <PlayerName className='text-xl text-green-800' style={{top: '55px'}}>{bestEarlyStarter}</PlayerName>}
        </div>
      }
      {// Best 슬로우 스타터
        tap === 4 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>Best 슬로우 스타터</Title>
          <SubTitle className=''>후반에 포인트 기록한 비율이 가장 높은 플레이어</SubTitle>
          {bestSlowStarter && <PlayerName className='text-xl text-green-800' style={{top: '55px'}}>{bestSlowStarter}</PlayerName>}
        </div>
      }
      {// 손케듀오
        tap === 5 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl '>손케 듀오</Title>
          <SubTitle className=''>합작한 골이 제일 많은 플레이어 듀오</SubTitle>
          {sonKaeDuo?.map(player => <PlayerName key={player.key} className='text-xl text-green-800 relative' style={{top: '62px'}}>
            {player.key.split('_')[0]} - {player.key.split('_')[1]}
          </PlayerName>)}
          <span className='relative' style={{top: '145px'}}>{sonKaeDuo.length > 0 && sonKaeDuo[0].count}골</span>
        </div>
      }
      {// 탐욕왕
        tap === 6 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl '>내가 할게!</Title>
          <SubTitle className=''>골,어시 중 골 비율이 가장 높은 플레이어</SubTitle>
          {greedyPlayer?.map(player => <PlayerName key={player.key} className='text-xl text-green-800' style={{top: '30px'}}>{player}</PlayerName>)}
        </div>
      }
      {// 양보왕
        tap === 7 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>너가 해!</Title>
          <SubTitle className=''>골,어시 중 어시 비율이 가장 높은 플레이어</SubTitle>
          {altruisticPlayer?.map(player => <PlayerName key={player.key} className='text-xl text-green-800' style={{top: '30px'}}>{player}</PlayerName>)}
        </div>
      }
      {// 최다 같은 팀
        tap === 8 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>짝궁</Title>
          <SubTitle className=''>같은 팀을 가장 많이 한 플레이어 듀오</SubTitle>
          <PlayerName className={`${mostPartnerPlayers && 'text-xl text-green-800'}`} style={{top: '40px'}}>{mostPartnerPlayers ? mostPartnerPlayers.split('_')[0] + ' - ' + mostPartnerPlayers.split('_')[1] : '선정되지 않았습니다'}</PlayerName>
          {mostPartnerPlayers && <span className='text-sm relative' style={{top: '75px'}}>{mostPartnerPlayers.split('_')[2]}회</span>}
        </div>
      }
      {// 용병 최다 횟수 인원
        tap === 9 &&
        <div className='flex flex-col gap-1'>
          <Title className='text-xl'>인맥킹</Title>
          <SubTitle className=''>용병을 가장 많이 데려온 플레이어</SubTitle>
          <PlayerName className={`${mostMercenaryPlayer && 'text-xl text-green-800 relative'}`} style={{top: '70px'}}>{mostMercenaryPlayer ? mostMercenaryPlayer.split('_')[0] : '선정되지 않았습니다'}</PlayerName>
          {mostMercenaryPlayer && <PlayerName className='text-sm relative' style={{top: '125px'}}>{mostMercenaryPlayer.split('_')[1]}회</PlayerName>}
        </div>
      }
      <div className='flex flex-row w-full justify-center gap-14' style={{marginTop: tap === 7 && '30px', position: [1, 2].includes(tap) && 'fixed', top: [1, 2].includes(tap) && '356px'}}>
        <BackgroundImage $propsImage={tapImage[tap]} $propsSize={tapImageSize[tap]} $propsTap={tap} />
        {[1, 2].includes(tap) && <BackgroundImage $propsImage={tapImage[tap]} $propsSize={tapImageSize[tap]} $propsTap={tap} />}
      </div>
      <PlayersBox className='flex gap-5 flex-wrap fixed bottom-5 justify-center overflow-y-auto border-t-2 border-t-gray-200 border-b-2 border-b-gray-200' $showDetail={showDetail}>
        {!showDetail && thisQuarterPlayers.map(player => <ActivePlayer key={player} className='text-green-900 cursor-pointer' onClick={() => playerDetailHandler(player)}>{player}</ActivePlayer>)}
        {showDetail &&
          <div>
            <div className='flex flex-col'>
              <ActivePlayer className='underline decoration-2 decoration-solid decoration-yellow-400 text-green-800 mb-2'>{playerDetail['name']}</ActivePlayer>
              {playerDetail['description']
                ?
                <span>{playerDetail['description']}</span>
                :
                <div>
                  <ListBody><ListTitle>MVP</ListTitle><span> {playerDetail['mvp'] + '회'}</span></ListBody>
                  <ListBody><ListTitle>최다 골 합작</ListTitle><span> {playerDetail['combi'].map(name => <span key={name} style={{marginRight: '3px'}}>{name}</span>)}, {playerDetail['combiCount']}골</span></ListBody>
                  <ListBody><ListTitle>최다 같은 팀</ListTitle><span> {playerDetail['mostPartner'].map(name => <span key={name} style={{marginRight: '3px'}}>{name}</span>)}, {playerDetail['mostPartnerCount']}회</span></ListBody>
                  <ListBody><ListTitle>용병 호출</ListTitle><span> {playerDetail['mercenary']}회</span></ListBody>
                  <ListBody><ListTitle>스타일</ListTitle><span> {playerDetail['style'].map(style => <span key={style} style={{marginRight: '5px'}}>#{style}</span>)}</span></ListBody>
                </div>
              }
            </div>
            <Close className='cursor-pointer' onClick={() => setShowDetail(false)}>X</Close>
          </div>
        }
      </PlayersBox>
        </>
      }

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
    position: absolute;
    right: ${props => props.$direction === 'right' && '-15px'};
    background: ${props => props.$direction === 'right' ? `url(${right}) no-repeat center center` : `url(${left}) no-repeat center center`};
    background-size: 100% 100%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 30px;
        height: 30px;
    };
    @media (prefers-color-scheme: dark) {
        filter: invert(1);
    };
`

const Title = styled.span`
  font-family: 'KBO-Dia-Gothic_bold', serif;
  color: #eab308;
`

const SubTitle = styled.span`
  font-size: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #166534;
`

const PlayerName = styled.span`
  position: relative;
  z-index: 1;
  @media (prefers-color-scheme: dark) {
    color: #eab308;
  }
`

const ActivePlayer = styled.span`
  @media (prefers-color-scheme: dark) {
    color: #eab308;
  }
`

const BackgroundImage = styled.div`
  width: ${props => props.$propsSize[0] + 'px'};
  height: ${props => props.$propsSize[1] + 'px'};
  background-image: ${props => `url(${props.$propsImage})`};
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  filter: ${props => ![3, 4].includes(props.$propsTap) && 'drop-shadow(2px 4px 6px black)'};
  position: relative;
  // bottom: ${props => props.$propsTap === 0 && '30px'};
  top: ${props => {
    if (props.$propsTap === 0) {
      return '-90px'
    }
    if (props.$propsTap === 1) {
      return '-25px'
    }
    if (props.$propsTap === 2) {
      return '-25px'
    }
    if (props.$propsTap === 3) {
      return '-15px'
    }
    if (props.$propsTap === 4) {
      return '-10px'
    }
    if (props.$propsTap === 5) {
      return '-40px'
    }
    if (props.$propsTap === 6) {
      return '-67px'
    }
    if (props.$propsTap === 7) {
      return '-40px'
    }
    if (props.$propsTap === 8) {
      return '-40px'
    }
    if (props.$propsTap === 9) {
      return '-48px'
    }
  }};
  left: ${props => {
    if ([0, 1, 2, 3, 5].includes(props.$propsTap)) {
      return '0'
    }
    if (props.$propsTap === 4) {
      return '2px'
    }
    if ([6, 7].includes(props.$propsTap)) {
      return '-25px'
    }
  }};
  opacity: ${props => {
    if ([0, 1, 2, 5, 6, 7, 8, 9].includes(props.$propsTap)) {
      return '0.3'
    }
    if ([3, 4].includes(props.$propsTap)) {
      return '0.2'
    }
  }};
  z-index: 0;
`

const PlayersBox = styled.div`
  filter: ${props => !props.$showDetail && 'drop-shadow(2px 0px 6px gray)'};
  padding: ${props => !props.$showDetail ? '10px 30px 5px 30px' : '10xp 10px 5px 10px'};
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
`

const ListBody = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-bottom: 3px;
`