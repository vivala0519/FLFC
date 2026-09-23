import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
import { getDatabase, onValue, ref } from 'firebase/database'

import NewBadge from '@/components/atoms/NewBadge.jsx'
import BestFiveCard from '@/components/organisms/BestFiveCard.jsx'
import PlayerRadarChart from '@/components/organisms/PlayerRadarChart.jsx'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'
import useRecentForm from '@/hooks/useRecentForm.js'
import useScoringStreak from '@/hooks/useScoringStreak.js'
import useBestFive from '@/hooks/useBestFive.js'
import { getQuarterRoundGoals } from '@/apis/roundGoals.js'
import { analyzeStarterStats } from '@/apis/analyzeStarterStats.js'
import { analyzeStarterPointRate } from '@/apis/analyzeStarterPointRate.js'
import { analyzeWinningTrio } from '@/apis/analyzeWinningTrio.js'
import { analyzeLowScoringDuo } from '@/apis/analyzeLowScoringDuo.js'
import { analyzePlayerRadar } from '@/apis/analyzePlayerRadar.js'

const analysisIconPaths = {
  bestFive: <path d="m12 2 2.8 6 6.6.8-4.8 4.5 1.2 6.5L12 17l-5.8 2.8 1.2-6.5-4.8-4.5 6.6-.8L12 2Z" />,
  trophy: <>
    <path d="M7 3h10v7a5 5 0 0 1-10 0V3Z" />
    <path d="M7 5H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4M12 15v4m-4 2h8" />
  </>,
  ten: <>
    <circle cx="12" cy="12" r="9" />
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">10</text>
  </>,
  twenty: <>
    <circle cx="12" cy="12" r="9" />
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">20</text>
  </>,
  rising: <><path d="m3 17 6-6 4 4 7-8" /><path d="M15 7h5v5" /></>,
  falling: <><path d="m3 7 6 6 4-4 7 8" /><path d="M15 17h5v-5" /></>,
  early: <>
    <path d="M2 19h20M6 19a6 6 0 0 1 12 0M12 3v3M4.5 9l2 2M19.5 9l-2 2" />
  </>,
  late: <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l4 2" />
  </>,
  trio: <>
    <circle cx="12" cy="6" r="2" /><circle cx="5" cy="9" r="1.5" /><circle cx="19" cy="9" r="1.5" />
    <path d="M8 20v-3a4 4 0 0 1 8 0v3M2 19v-2a3 3 0 0 1 4-2.8M22 19v-2a3 3 0 0 0-4-2.8" />
  </>,
  duo: <>
    <circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" />
    <path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2m0 0v-2a5.5 5.5 0 0 1 8 0v2" />
  </>,
  streak: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  partners: <><path d="M10 7H8a4 4 0 0 0 0 8h3m3-8h2a4 4 0 0 1 0 8h-3M8 11h8" /></>,
  handshake: <>
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="M11 4H3a1 1 0 0 0-1 1v8.172a2 2 0 0 0 .586 1.414L8.5 20.5a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.654.394a2 2 0 0 0 1.031.286H21a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1h-1" />
  </>,
  alarm: <>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M5 3l2 2M19 3l-2 2M5 21l2-2M19 21l-2-2" />
  </>,
}

const AnalysisIcon = ({ name }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="h-5 w-5 shrink-0 text-blueSignature dark:text-yellow-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {analysisIconPaths[name]}
  </svg>
)

const trendChangeFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

const detailsButtonClass = 'ml-6 rounded px-1 py-0.5 text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-yellow-400 dark:hover:text-yellow-300'

const closeDialogOnBackdropClick = (event) => {
  if (event.target !== event.currentTarget) return
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
    event.currentTarget.close()
  }
}

const bestFiveRoles = [
  { key: 'pivo', label: 'ST', description: '스트라이커', metric: 'goals' },
  { key: 'leftAla', label: 'LM', description: '왼쪽 미드필더', metric: 'assists' },
  { key: 'rightAla', label: 'RM', description: '오른쪽 미드필더', metric: 'assists' },
  { key: 'fixo', label: 'DF', description: '수비수', metric: 'points' },
  { key: 'goleiro', label: 'GK', description: '골키퍼', metric: 'points' },
]

const AnalysisTap = (props) => {
  const { test } = props
  const { existingMembers, totalMembers } = getMembers()
  const { time: { thisYear, thisMonth: currentMonth, thisDate } } = getTimes()
  const { totalWeeklyTeamData } = getRecords()
  const recentFormDialogRef = useRef(null)
  const bestFiveDialogRef = useRef(null)
  const asOfDate = test ? '2024-12-31' : `${thisYear}-${String(currentMonth).padStart(2, '0')}-${String(thisDate).padStart(2, '0')}`
  const recentForm = useRecentForm(existingMembers, asOfDate)
  const scoringStreakResult = useScoringStreak(totalMembers, asOfDate, existingMembers)
  const scoringStreak = {
    ...scoringStreakResult,
    count: scoringStreakResult.count > 0 ? `${scoringStreakResult.count}일 연속` : '',
  }
  const longestAbsent = {
    ...scoringStreakResult.longestAbsent,
    status: scoringStreakResult.status,
    count: scoringStreakResult.longestAbsent.lastDate
      ? `마지막 출석 ${scoringStreakResult.longestAbsent.lastDate.replaceAll('-', '.')}` : '',
  }
  const thisMonth = test ? 12 : new Date().getMonth() + 1
  const bestFive = useBestFive(test ? '2024' : thisYear, thisMonth)
  const playerComparison = useMemo(() => analyzePlayerRadar(
    bestFive.records, existingMembers, thisMonth,
  ), [bestFive.records, existingMembers, thisMonth])
  const quarter = Math.ceil(thisMonth / 3)
  const [needMoreData, setNeedMoreData] = useState(false)
  const [thisQuarterData, setThisQuarterData] = useState([])
  const [yearRoundData, setYearRoundData] = useState(null)
  const [roundLoadError, setRoundLoadError] = useState(false)
  const [processedQuarterSource, setProcessedQuarterSource] = useState(null)
  const [processedWeeklyTeamSource, setProcessedWeeklyTeamSource] = useState(null)
  const [processedPartnerData, setProcessedPartnerData] = useState(null)
  const [mvpStatus, setMvpStatus] = useState('loading')
  const [thisQuarterPlayers, setThisQuarterPlayers] = useState([])
  const [sonKaeDuo, setSonKaeDuo] = useState({})
  const [mostMvpPlayer, setMostMvpPlayer] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [mostPartnerPlayers, setMostPartnerPlayers] = useState({})
  const [mostMercenaryPlayer, setMostMercenaryPlayer] = useState({})
  const [tenTenClub, setTenTenClub] = useState({})
  const [twentyTwentyClub, setTwentyTwentyClub] = useState({})
  const [greedyPlayer, setGreedyPlayer] = useState({})
  const [altruisticPlayer, setAltruisticPlayer] = useState({})
  const [showIndividual, setShowIndividual] = useState(false)
  const starterPointRates = useMemo(() => analyzeStarterPointRate(
    yearRoundData,
    totalWeeklyTeamData,
    totalMembers,
    test ? '2024' : thisYear,
    thisMonth,
  ), [yearRoundData, totalWeeklyTeamData, totalMembers, test, thisYear, thisMonth])
  const formatStarter = (players, period) => ({
    name: players.map((player) => {
      const { name } = player
      return `${name}`
    }),
  })
  const bestEarlyStarter = formatStarter(starterPointRates.early, 'early')
  const bestSlowStarter = formatStarter(starterPointRates.late, 'late')
  const winningTrioStats = useMemo(() => analyzeWinningTrio(
    yearRoundData,
    totalWeeklyTeamData,
    existingMembers,
    test ? '2024' : thisYear,
    thisMonth,
  ), [yearRoundData, totalWeeklyTeamData, existingMembers, test, thisYear, thisMonth])
  const winningTrio = winningTrioStats ? {
    name: [winningTrioStats.players.join(' - ')],
    count: `승률 ${Math.round(winningTrioStats.winRate * 100)}%`,
  } : {}
  const lowScoringDuoStats = useMemo(() => analyzeLowScoringDuo(
    thisQuarterData,
    totalWeeklyTeamData,
    totalMembers,
    test ? '2024' : thisYear,
    thisMonth,
  ), [thisQuarterData, totalWeeklyTeamData, totalMembers, test, thisYear, thisMonth])
  const lowScoringDuo = lowScoringDuoStats ? {
    name: lowScoringDuoStats.pairs.map(({ players }) => players.join(' - ')),
    count: `같은 팀 ${lowScoringDuoStats.pairs[0].sharedDays}회 · 합작 ${lowScoringDuoStats.pairs[0].points}골`,
  } : {}

  const analysisItems = [
    {
      type: 'best-five',
      isNew: true,
      icon: 'bestFive',
      title: 'BEST Ⅴ',
      // description: '분기 출석률 50% 이상',
      data: bestFive,
    },
    {
      icon: 'trophy',
      title: '최다 MVP',
      description: '데일리 MVP 최다 플레이어',
      data: mostMvpPlayer,
    },
    {
      icon: 'ten',
      title: '10-10 클럽',
      description: '골, 어시 각각 10개 이상 달성 플레이어',
      data: tenTenClub,
    },
    {
      icon: 'twenty',
      title: '20-20 클럽',
      description: '골, 어시 각각 20개 이상 달성 플레이어',
      data: twentyTwentyClub,
    },
    {
      type: 'recent-form',
      isNew: true,
      icon: 'rising',
      title: '최근 상승세',
      // description: '최근 출석 2회와 직전 2회의 공격포인트·승점 합계 비교',
      data: recentForm,
    },
    {
      type: 'recent-fall',
      isNew: true,
      icon: 'falling',
      title: '최근 하락세',
      // description: '최근 출석 2회와 직전 2회의 공격포인트·승점 합계 비교',
      data: recentForm,
    },
    {
      type: 'starter',
      icon: 'early',
      title: '얼리 스타터',
      description: '9시 이전 승점생산률이 제일 높은 플레이어',
      data: bestEarlyStarter,
    },
    {
      type: 'starter',
      icon: 'late',
      title: '슬로우 스타터',
      description: '9시 이후 승점생산률이 제일 높은 플레이어',
      data: bestSlowStarter,
    },
    {
      isNew: true,
      icon: 'trio',
      title: '세 얼간이',
      description: '승률이 제일 높은 트리오',
      data: winningTrio,
    },
    {
      type: 'duo',
      icon: 'duo',
      title: '손케 듀오',
      description: '합작 골이 가장 많은 듀오',
      data: sonKaeDuo,
    },
    {
      type: 'scoring-streak',
      isNew: true,
      icon: 'streak',
      title: '꾸준한 해결사',
      description: '출석할 때마다 골을 기록한 연속 횟수 Top 플레이어',
      data: scoringStreak,
    },
    {
      icon: 'partners',
      title: '와이리 많이 봅니까 우리',
      description: '최다 같은 팀 듀오',
      data: mostPartnerPlayers,
    },
    {
      type: 'low-scoring-duo',
      isNew: true,
      icon: 'handshake',
      title: '친해지자..',
      description: '같은 팀 횟수 대비 공격포인트가 가장 낮은 듀오',
      data: lowScoringDuo,
    },
    {
      type: 'longest-absent',
      isNew: true,
      icon: 'alarm',
      title: '깨어나세요..',
      description: '마지막 출석이 가장 오래된 플레이어',
      data: longestAbsent,
    },
  ]

  // 개인별 데이터
  const [thisQuarterMVP, setThisQuarterMVP] = useState([])
  const [thisQuarterPointData, setThisQuarterPointData] = useState(null)
  const [thisQuarterDataByTime, setThisQuarterDataByTime] = useState(null)
  const [thisQuarterMostPartners, setThisQuarterMostPartners] = useState(null)
  const [thisQuarterPlayersCombination, setThisQuarterPlayersCombination] =
    useState(null)
  const [mercenaryBring, setMercenaryBring] = useState(null)
  const integratedData = useMemo(() => {
    if (!thisQuarterPointData || !thisQuarterDataByTime ||
      thisQuarterMostPartners === null || mercenaryBring === null) return null
    const integratedMap = new Map()
    thisQuarterPointData.forEach((value, key) => {
      integratedMap.set(key, {
        ...value,
        ...thisQuarterDataByTime.get(key),
        ...thisQuarterMostPartners[key],
        ...mercenaryBring.get(key),
      })
    })
    return integratedMap
  }, [thisQuarterPointData, thisQuarterDataByTime, thisQuarterMostPartners, mercenaryBring])
  const [playerDetail, setPlayerDetail] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const selectedFoot = bestFive.memberInfo?.[playerDetail?.name]?.preferredFoot
  const preferredFootLabel = selectedFoot === 'L' ? '왼발'
    : selectedFoot === 'R' ? '오른발'
      : bestFive.memberInfo ? '정보 없음'
        : bestFive.status === 'error' ? '정보를 불러오지 못했습니다' : '불러오는 중'

  useEffect(() => {
    getDailyMVPData().catch(() => setMvpStatus('error'))
  }, [])

  useEffect(() => {
    const yearRef = ref(getDatabase(), test ? '2024' : thisYear)
    setRoundLoadError(false)
    return onValue(yearRef, (snapshot) => {
      const value = snapshot.val()
      setYearRoundData(value || {})
      setThisQuarterData(getQuarterRoundGoals(value, thisMonth))
    }, () => setRoundLoadError(true))
  }, [test, thisYear, thisMonth])

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
      const { leaders, chasing } = getSonKaeDuo(totalData)
      const duoName = ({ key }) => key.split('_').map((name) => getFullName(name) || name).join(' - ')
      setSonKaeDuo(leaders.length > 0 ? {
        name: leaders.map(duoName),
        count: `${leaders[0].count}골`,
        additional: chasing.map(duoName),
        additionalCount: chasing.length > 0 ? `${chasing[0].count}골` : '',
      } : {})

      // 시간에 따른 포인트 분석 데이터
      const { dataByTime } = analyzeStarterStats(totalData)
      // 플레이어당 골/어시 데이터
      const pointData = {}
      const pointDataMap = new Map()
      totalData.forEach((item) => {
        if (item.goal !== '용병') {
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

      setThisQuarterDataByTime(dataByTime)
      setThisQuarterPointData(pointDataMap)
    } else {
      // 데이터 모으는 중
      setNeedMoreData(true)
      setThisQuarterPointData(new Map())
      setThisQuarterDataByTime(new Map())
      setThisQuarterPlayersCombination(new Map())
    }
    setProcessedQuarterSource({ data: thisQuarterData, members: existingMembers })
  }, [thisQuarterData, existingMembers])

  const getFullName = (name) => {
    for (let i = 0; i < existingMembers.length; i++) {
      if (existingMembers[i].includes(name)) {
        return existingMembers[i]
      }
    }
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
    setMvpStatus('ready')
  }

  const getWeeklyTeamData = useCallback(() => {
    const fetchedData = totalWeeklyTeamData.filter((data) =>
      typeof data?.id === 'string' && data.id.slice(0, 2) === thisYear.slice(2, 4),
    )

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
      for (const teamNumber of [1, 2, 3]) {
        if (Array.isArray(arr?.[teamNumber])) totalTeamData.push(arr[teamNumber])
      }
    })

    // 플레이어 당 통계
    const playerData = {}
    const mercenary = {}
    const mercenaryMap = new Map()
    let maxMercenaryCount = 0
    totalTeamData.forEach((row) => {
      row.forEach((player) => {
        if (typeof player !== 'string' || !player) return
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
        if (player && !player.includes('용병')) {
          if (!playerData[player]) {
            playerData[player] = {}
          }
          const exceptSelf = row.filter(
            (name) => typeof name === 'string' && ![player, ''].includes(name) && !name.includes('용병'),
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

    setMercenaryBring(mercenaryMap)
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
    if (temp.length === 1) {
      const fullName = existingMembers.find((member) => member.includes(temp[0]))
      setMostMercenaryPlayer({
        name: [fullName],
        count: maxMercenaryCount + '회',
      })
    }
    setProcessedWeeklyTeamSource({ data: totalWeeklyTeamData, members: existingMembers })
  }, [totalWeeklyTeamData, thisYear, thisMonth, existingMembers])

  useEffect(() => {
    if (Array.isArray(totalWeeklyTeamData) && existingMembers.length > 0) {
      getWeeklyTeamData()
    }
  }, [totalWeeklyTeamData, existingMembers, getWeeklyTeamData])

  const getSonKaeDuo = (totalData) => {
    // 최다 골 합작
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
        combinationMap.set(key, (combinationMap.get(key) || 0) + 1)
      }
    })
    setThisQuarterPlayersCombination(combinationMap)

    const ranked = [...combinationMap].map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    const topCount = ranked[0]?.count
    const nextCount = ranked.find(({ count }) => count < topCount)?.count
    return {
      leaders: ranked.filter(({ count }) => count === topCount),
      chasing: nextCount === undefined ? [] : ranked.filter(({ count }) => count === nextCount),
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
    setProcessedPartnerData(data)

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

  const playerDetailHandler = (name) => {
    const detailMap = integratedData?.get(name.slice(1, 3))
    if (detailMap) {
      const detail = {
        name: name,
        mostPartner: detailMap.name || [],
        mostPartnerCount: detailMap.count || 0,
        style: [],
        mvp: 0,
        mercenary: detailMap.mercenary ? detailMap.mercenary : 0,
      }
      // play style
      // if (detailMap.goal > detailMap.assist) {
      //   detail['style'].push('개인적')
      // } else if (detailMap.goal < detailMap.assist) {
      //   detail['style'].push('이타적')
      // }
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
        description: '추가 분석 기록이 없습니다.',
      }
      setPlayerDetail(detail)
    }
    setShowDetail(true)
  }

  const hasLoadError = roundLoadError || mvpStatus === 'error'
  const isDataLoading =
    yearRoundData === null ||
    !Array.isArray(totalWeeklyTeamData) ||
    totalMembers.length === 0 ||
    existingMembers.length === 0 ||
    mvpStatus === 'loading' ||
    bestFive.status === 'loading' ||
    recentForm.status === 'loading' ||
    scoringStreakResult.status === 'loading' ||
    needMoreData ||
    processedQuarterSource?.data !== thisQuarterData ||
    processedQuarterSource?.members !== existingMembers ||
    processedWeeklyTeamSource?.data !== totalWeeklyTeamData ||
    processedWeeklyTeamSource?.members !== existingMembers ||
    weeklyTeamData === null ||
    processedPartnerData !== weeklyTeamData ||
    thisQuarterMostPartners === null ||
    thisQuarterPointData === null ||
    thisQuarterDataByTime === null ||
    thisQuarterPlayersCombination === null ||
    mercenaryBring === null ||
    integratedData === null

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col px-2 pb-10 text-left">
      <h2 className="my-5 text-center text-sm">
        {thisYear} - 제 {quarter} 시즌
      </h2>
      {hasLoadError ? (
        <div className="py-8 text-center" role="alert">
          분석 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.
        </div>
      ) : isDataLoading ? (
        <div className="py-8 text-center" role="status">
          <p>데이터를 모으는 중 입니다</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">4주 이상의 데이터 필요.. ({thisQuarterData.length}/4)</p>
        </div>
      ) : (
        <>
          <section className="mb-5 border-y-2 border-gray-200 dark:border-gray-700 py-4" aria-label="개인별 기록">
            <div className="flex justify-center">
              <button
                type="button"
                className="bg-transparent py-1 text-sm text-blue-700 dark:text-yellow-400 border-2 border-blue-500 dark:border-yellow-400"
                aria-expanded={showIndividual}
                aria-controls="individual-analysis"
                onClick={() => {
                  setShowIndividual(!showIndividual)
                  setShowDetail(false)
                }}
              >
                {showIndividual ? '접기' : '개인별 기록 보기'}
              </button>
            </div>
            <div id="individual-analysis" hidden={!showIndividual}>
              {!showDetail ? (
                <div className="mt-3 flex flex-wrap gap-2 justify-center items-center">
                  {thisQuarterPlayers.length > 0 ? (
                    thisQuarterPlayers.map((player) => (
                      <button
                        type="button"
                        key={player}
                        className="bg-transparent px-2 py-1 text-sm text-blueSignature dark:text-yellow-400"
                        onClick={() => playerDetailHandler(player)}
                      >
                        {player}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">기록이 없습니다.</p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400">{playerDetail.name}</h4>
                    <button
                      type="button"
                      className="bg-transparent px-2 py-1 text-sm text-gray-500 dark:text-gray-400"
                      onClick={() => setShowDetail(false)}
                    >
                      플레이어 목록으로
                    </button>
                  </div>
                  {bestFive.status === 'ready' ? (
                    <PlayerRadarChart name={playerDetail.name} comparison={playerComparison} />
                  ) : (
                    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400" role="status">
                      {bestFive.status === 'error' ? '비교 기록을 불러오지 못했습니다.' : '비교 기록을 불러오는 중입니다.'}
                    </p>
                  )}
                  <dl className="mb-2 text-sm">
                    <div className="flex gap-4">
                      <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">주발</dt>
                      <dd className="min-w-0 break-words">{preferredFootLabel}</dd>
                    </div>
                  </dl>
                  {playerDetail.description ? (
                    <p className="text-sm">{playerDetail.description}</p>
                  ) : (
                    <dl className="space-y-2 text-sm">
                      {[
                        ['MVP', `${playerDetail.mvp}회`],
                        [
                          '최다 골 합작',
                          playerDetail.combi.length > 0 ? `${playerDetail.combi.join(', ')} · ${playerDetail.combiCount}골` : '기록 없음',
                        ],
                        [
                          '최다 같은 팀',
                          playerDetail.mostPartner.length > 0
                            ? `${playerDetail.mostPartner.join(', ')} · ${playerDetail.mostPartnerCount}회`
                            : '기록 없음',
                        ],
                        ['스타일', playerDetail.style.length > 0 ? playerDetail.style.map((style) => `#${style}`).join(' ') : '기록 없음'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex gap-4">
                          <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                          <dd className="min-w-0 break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </div>
          </section>
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
          {analysisItems.map(({ type, isNew, icon, title, description, data }) => {
            const players = data.name?.filter(Boolean) ?? []
            const almostPlayers = data.additional?.filter(Boolean) ?? []
            const trendPlayers = type === 'recent-fall' ? recentForm.decliners : recentForm.leaders

            return (
              <div key={title} className="py-5 first:pt-0">
                <dt className="flex items-center gap-2 font-bold text-lg">
                  <AnalysisIcon name={icon} />
                  <span className="relative inline-block">
                    {title}
                    {isNew && <NewBadge />}
                  </span>
                  {type === 'best-five' && (
                    <button
                      type="button"
                      className={detailsButtonClass}
                      aria-label="BEST Ⅴ 선정 기준 자세히 보기"
                      aria-haspopup="dialog"
                      aria-controls="best-five-method-dialog"
                      onClick={() => bestFiveDialogRef.current?.showModal()}
                    >
                      자세히 보기
                    </button>
                  )}
                  {(type === 'recent-form' || type === 'recent-fall') && (
                    <button
                      type="button"
                      className={detailsButtonClass}
                      aria-label={`${title} 계산 방식 자세히 보기`}
                      aria-haspopup="dialog"
                      aria-controls="recent-form-method-dialog"
                      onClick={() => recentFormDialogRef.current?.showModal()}
                    >
                      자세히 보기
                    </button>
                  )}
                </dt>
                {description && <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</dd>}
                {type === 'best-five' ? (
                  <dd className="mt-4" aria-live="polite">
                    {data.status === 'loading' ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">플레이어 기록을 불러오는 중입니다.</p>
                    ) : data.status === 'error' ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">플레이어 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
                    ) : data.positions ? (
                      <BestFiveCard positions={data.positions} />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">이번 분기 출석률 50% 이상인 플레이어가 없습니다.</p>
                    )}
                  </dd>
                ) : (type === 'scoring-streak' || type === 'longest-absent') && data.status !== 'ready' ? (
                  <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
                    {data.status === 'loading'
                      ? '전체 출석 기록을 불러오는 중입니다.'
                      : '전체 출석 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'}
                  </dd>
                ) : type === 'recent-form' || type === 'recent-fall' ? (
                  <>
                    <dd className="mt-2" aria-live="polite">
                      {recentForm.status === 'ready' && trendPlayers.length > 0 ? (
                        <ul className="space-y-1">
                          {trendPlayers.map((player) => (
                            <li key={player.name} className="flex flex-wrap items-baseline gap-x-2">
                              <span className="font-semibold text-blueSignature dark:text-yellow-400">{player.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                공포 {trendChangeFormatter.format(player.increase)} · 승점{' '}
                                {trendChangeFormatter.format(player.winPointIncrease)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {recentForm.status === 'loading'
                            ? '출석 기록을 불러오는 중입니다.'
                            : recentForm.status === 'error'
                              ? '출석 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'
                              : recentForm.eligibleCount === 0
                                ? '이번 분기 2회 이상, 총 4회 이상 출석하고 이전 2회가 최근 8주 안에 있어야 비교할 수 있습니다.'
                                : `최근 공격포인트와 승점 합계의 ${type === 'recent-fall' ? '하락' : '상승'} 조건에 맞는 플레이어가 없습니다.`}
                        </p>
                      )}
                    </dd>
                  </>
                ) : (
                  <>
                    <dd className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="min-w-0 break-words font-semibold text-blueSignature dark:text-yellow-400">
                        {players.length > 0 ? players.join(type === 'duo' || type === 'low-scoring-duo' || type === 'starter' ? ', ' : ' ') : '-'}
                      </span>
                      {players.length > 0 && data.count && <span className="text-sm">{data.count}</span>}
                    </dd>
                    {almostPlayers.length > 0 && (
                        <dd className="mt-2 break-words text-sm text-gray-500 dark:text-gray-400">
                          <p className="mr-2 font-medium text-goal dark:text-rose-400">
                            {type === 'duo' ? '추격 듀오' : '달성 임박'}
                          </p>
                          {almostPlayers.join(', ')}
                          <p>{type === 'duo' && data.additionalCount && `${data.additionalCount}`}</p>
                        </dd>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </dl>

        <dialog
          ref={bestFiveDialogRef}
          id="best-five-method-dialog"
          aria-labelledby="best-five-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-left text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 id="best-five-method-title" className="text-lg font-bold">BEST Ⅴ</h3>
            <form method="dialog">
              <button type="submit" className="rounded px-2 py-1 text-sm text-blue-700 hover:underline dark:text-yellow-400">닫기</button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>이번 분기 출석일의 50% 이상 참석한 플레이어 중</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>ST: 골이 가장 많은 플레이어</li>
              <li>LM: 왼발잡이 중 어시가 가장 많은 플레이어</li>
              <li>RM: 오른발잡이 중 어시가 가장 많은 플레이어</li>
              <li>DF: 승점생산률이 가장 높은 플레이어</li>
              <li>GK: 키퍼만 참여 플레이어 중 승점생산률 가장 높은 플레이어 (없을 시 승점생산률 2위)</li>
            </ul>
          </div>
        </dialog>

        <dialog
          ref={recentFormDialogRef}
          id="recent-form-method-dialog"
          aria-labelledby="recent-form-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-left text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 id="recent-form-method-title" className="text-lg font-bold">
              최근 상승세·하락세 계산 방식
            </h3>
            <form method="dialog">
              <button type="submit" className="rounded px-2 py-1 text-sm text-blue-700 hover:underline dark:text-yellow-400">
                닫기
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>플레이어별 최근 출석 2회와 그 직전 출석 2회를 비교합니다.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>상승세: 두 지표 중 하나 이상 증가하고, 다른 지표는 감소하지 않은 플레이어</li>
              <li>하락세: 두 지표 중 하나 이상 감소하고, 다른 지표는 증가하지 않은 플레이어</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">이번 분기 2회 이상, 8주 이내에 총 4회 이상 출석해야 합니다.</p>
          </div>
        </dialog>

        </>
      )}
    </div>
  )
}

export default AnalysisTap
