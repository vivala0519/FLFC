import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { get, getDatabase, ref } from 'firebase/database'

import NewBadge from '@/components/atoms/NewBadge.jsx'
import GoalkeeperBadge from '@/components/atoms/GoalkeeperBadge.jsx'
import BestFiveCard from '@/components/organisms/BestFiveCard.jsx'
import PlayerRadarChart from '@/components/organisms/PlayerRadarChart.jsx'
import QuarterlyRecordChart from '@/components/organisms/QuarterlyRecordChart.jsx'
import DuoRecordList from '@/components/molecules/DuoRecordList.jsx'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'
import useRecentForm from '@/hooks/useRecentForm.js'
import useScoringStreak from '@/hooks/useScoringStreak.js'
import useBestFive from '@/hooks/useBestFive.js'
import useAnalysisSeason from '@/hooks/useAnalysisSeason.js'
import { getQuarterRoundGoals } from '@/apis/roundGoals.js'
import { analyzeStarterStats } from '@/apis/analyzeStarterStats.js'
import { analyzeStarterPointRate, analyzeCareerStarterStyles } from '@/apis/analyzeStarterPointRate.js'
import { analyzeWinningTrio } from '@/apis/analyzeWinningTrio.js'
import { analyzeLowScoringDuo } from '@/apis/analyzeLowScoringDuo.js'
import { analyzeSeasonGoalDuos } from '@/apis/analyzeSeasonGoalDuos.js'
import { analyzeGoalkeeperRadar, analyzePlayerRadar } from '@/apis/analyzePlayerRadar.js'
import { analyzeCareerRecords, getCareerAttackStyle } from '@/apis/analyzeCareerRecords.js'
import { analyzeCleanSheets } from '@/apis/analyzeCleanSheets.js'
import { analyzePlayerSeasons } from '@/apis/analyzePlayerSeasons.js'
import { analyzeCareerGoalDuos, analyzeCareerPartners } from '@/apis/analyzeCareerPartners.js'
import { analyzeCareerAwards } from '@/apis/analyzeCareerAwards.js'
import { getAnalysisHistoryRecords } from '@/apis/analysisHistoryRecords.js'
import { getAnalysisCachePeriod, getCachedAnalysisData, setCachedAnalysisData } from '@/apis/analysisDataCache.js'
import goldenBoot from '@/assets/golden-boot.png'
import ballonDor from '@/assets/ballon-dor.png'
import ligueOne from '@/assets/ligue-1.png'
import coppaItalia from '@/assets/coppa-italia.png'
import springIcon from '@/assets/spring-cherry-blossom-3d.png'
import summerIcon from '@/assets/summer-sun-3d.png'
import autumnIcon from '@/assets/autumn-maple-leaf-3d.png'
import winterIcon from '@/assets/winter-snowflake-3d.png'
import ChevronRightIcon from '@/assets/lucide/chevron-right.svg?react'
import './AnalysisTap.css'

const FIRST_RECORD_YEAR = 2021
const playerSeasonIcons = { spring: springIcon, summer: summerIcon, autumn: autumnIcon, winter: winterIcon }
const playerSeasonTextColors = {
  spring: 'text-pink-600 dark:text-pink-300',
  summer: 'text-amber-600 dark:text-amber-300',
  autumn: 'text-orange-600 dark:text-orange-300',
  winter: 'text-sky-600 dark:text-sky-300',
}
const careerAwardIcons = {
  득점왕: goldenBoot,
  승점왕: ballonDor,
  어시왕: ligueOne,
  출석왕: coppaItalia,
}
const AwardIconStack = ({ title, count }) => {
  const iconCount = Math.max(1, Math.floor(Number(count) || 1))
  const offset = iconCount > 1 ? Math.min(8, 56 / (iconCount - 1)) : 0

  return (
    <span aria-hidden="true" className="relative inline-block h-5 shrink-0" style={{ width: 20 + offset * (iconCount - 1) }}>
      {Array.from({ length: iconCount }, (_, index) => (
        <img
          key={index}
          src={careerAwardIcons[title]}
          alt=""
          className="absolute top-0 h-5 w-5 object-contain drop-shadow-sm"
          style={{ left: index * offset }}
        />
      ))}
    </span>
  )
}
const careerNumberFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const formatCareerNumber = (value, unit) => `${careerNumberFormatter.format(value)}${unit}`
const formatCareerHigh = (high, unit) => high?.season
  ? formatCareerNumber(high.value, unit)
  : '기록 없음'
const formatCleanSheetRecord = (status, value) => status === 'ready' ? value
  : status === 'error' ? '기록을 불러오지 못했습니다.' : '기록을 불러오는 중입니다.'
const formatMostConceded = (counts) => {
  const maximum = Math.max(0, ...[...(counts?.values() || [])])
  if (maximum === 0) return '기록 없음'
  const names = [...counts].filter(([, count]) => count === maximum)
    .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko'))
  return `${names.join(', ')} · ${formatCareerNumber(maximum, '골')}`
}

const formatAttendanceStreak = ({ count, additionalCount, ...stats }, status) => ({
  ...stats,
  status,
  currentCount: count,
  count: count > 0 ? `${count}일 연속` : '',
  additionalCount: additionalCount > 0 ? `${additionalCount}일 연속` : '',
})

const rankCareerCounts = (counts, unit, includeChasers = false, maxChasers = 2) => {
  const values = [...counts.values()]
  const maximum = Math.max(0, ...values)
  const nextCount = Math.max(0, ...values.filter((value) => value < maximum))
  const namesAt = (value) => value > 0 ? [...counts]
    .filter(([, count]) => count === value)
    .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko')) : []
  const chasers = includeChasers ? namesAt(nextCount) : []
  const additional = chasers.length <= maxChasers ? chasers : []
  return {
    name: namesAt(maximum),
    count: maximum > 0 ? formatCareerNumber(maximum, unit) : '',
    additional,
    additionalCount: additional.length > 0 ? formatCareerNumber(nextCount, unit) : '',
  }
}

const analyzeScoringRecords = (recordsByYear, asOfDate) => {
  const totals = new Map()
  const pointTotals = new Map()
  const attendanceTotals = new Map()
  const maxima = {
    goals: { field: '골', unit: '골', value: 0, names: new Set() },
    assists: { field: '어시', unit: '어시', value: 0, names: new Set() },
  }

  for (const [year, records] of Object.entries(recordsByYear || {})) {
    if (!/^\d{4}$/.test(year) || !Array.isArray(records)) continue
    for (const record of records) {
      if (!/^\d{4}$/.test(record?.id || '')) continue
      const month = Number(record.id.slice(0, 2))
      const day = Number(record.id.slice(2, 4))
      const date = new Date(Date.UTC(Number(year), month - 1, day))
      if (date.getUTCFullYear() !== Number(year) ||
        date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) continue
      const dateKey = `${year}-${record.id.slice(0, 2)}-${record.id.slice(2, 4)}`
      if (dateKey > asOfDate) continue

      for (const [name, stats] of Object.entries(record.data || {})) {
        if (!name.trim() || name.includes('용병')) continue
        const points = Number(stats?.['승점'])
        if (Number.isFinite(points) && points > 0) {
          pointTotals.set(name, (pointTotals.get(name) || 0) + points)
        }
        const attendance = Number(stats?.['출석'])
        if (Number.isFinite(attendance) && attendance > 0) {
          attendanceTotals.set(name, (attendanceTotals.get(name) || 0) + attendance)
        }
        for (const maximum of Object.values(maxima)) {
          const rawValue = stats?.[maximum.field]
          if (rawValue === null || rawValue === undefined ||
            (typeof rawValue === 'string' && !rawValue.trim())) continue
          const value = Number(rawValue)
          if (!Number.isFinite(value) || value <= 0) continue
          const playerTotals = totals.get(name) || { 골: 0, 어시: 0 }
          playerTotals[maximum.field] += value
          totals.set(name, playerTotals)
          if (value > maximum.value) {
            maximum.value = value
            maximum.names = new Set([name])
          } else if (value === maximum.value) {
            maximum.names.add(name)
          }
        }
      }
    }
  }

  const daily = Object.fromEntries(Object.entries(maxima).map(([key, maximum]) => [key, {
    name: [...maximum.names].sort((a, b) => a.localeCompare(b, 'ko')),
    count: maximum.value > 0 ? `${careerNumberFormatter.format(maximum.value)}${maximum.unit}` : '',
  }]))
  const getTotalLeaders = (field, unit) => rankCareerCounts(
    new Map([...totals].map(([name, stats]) => [name, stats[field]])), unit, true,
  )
  return {
    ...daily,
    totalGoals: getTotalLeaders('골', '골'),
    totalAssists: getTotalLeaders('어시', '어시'),
    totalAttackPoints: rankCareerCounts(
      new Map([...totals].map(([name, stats]) => [name, stats['골'] + stats['어시']])), '점', true,
    ),
    totalPoints: rankCareerCounts(pointTotals, '점', true),
    totalAttendance: rankCareerCounts(attendanceTotals, '회', true),
  }
}

const analysisIconPaths = {
  check: <path d="m5 12 4 4L19 6" />,
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
  playmaker: <>
    <path d="m14.5 6.5 3 3L6 21l-3-3L14.5 6.5ZM11.5 9.5l3 3" />
    <path d="M5 3v4M3 5h4M19 2v4M17 4h4M20 14v4M18 16h4" />
  </>,
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
  dailyGoal: <>
    <path d="M3 20V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12M3 12h18M8 6v14m8-14v14" />
    <circle cx="12" cy="16" r="2.5" />
  </>,
  dailyAssist: <>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="7" r="2.5" />
    <path d="m8 15 7-6m-1 0h1.5v1.5" />
  </>,
}

const AnalysisIcon = ({ name }) => name === 'goalkeeper' ? (
  <GoalkeeperBadge memberInfo={{ goalKeeper: true }} className="h-5 w-5 shrink-0 text-blueSignature dark:text-yellow-400" />
) : (
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

const AnalysisSectionHeading = ({ id, controls, title, subtitle, expanded, onToggle, borderTop = false }) => (
  <div className={`sticky top-0 z-20 w-full border-b-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${borderTop ? 'border-t-2' : ''}`}>
    <h2 id={id} className="w-full">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onToggle}
        className="relative flex w-full items-center justify-center rounded-none border-0 bg-transparent px-10 py-4 text-center font-dnf-forged focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-blue-300"
      >
        <span className="flex flex-col items-center">
          <span>{title}</span>
          {subtitle && <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{subtitle}</span>}
        </span>
        <ChevronRightIcon
          aria-hidden="true"
          className={`absolute right-3 h-4 w-4 text-gray-500 transition-transform motion-reduce:transition-none dark:text-gray-400 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
    </h2>
  </div>
)

const trendChangeFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

const detailsButtonClass = 'ml-2 rounded px-1 py-0.5 text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-yellow-400 dark:hover:text-yellow-300'

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
  const { existingMembers, totalMembers, oneCharacterMembers, membersNickName } = getMembers()
  const { time: { currentTime } } = getTimes()
  const cacheDay = getAnalysisCachePeriod(currentTime).dayKey
  const calendarYear = test ? '2024' : cacheDay.slice(0, 4)
  const currentMonth = Number(cacheDay.slice(5, 7))
  const { totalWeeklyTeamData } = getRecords()
  const recentFormDialogRef = useRef(null)
  const bestFiveDialogRef = useRef(null)
  const playerDetailDialogRef = useRef(null)
  const playerSeasonDialogRef = useRef(null)
  const asOfDate = test ? '2024-12-31' : cacheDay
  const analysisSeason = useAnalysisSeason(calendarYear, test ? 12 : currentMonth, cacheDay)
  const { year: thisYear, month: thisMonth, quarter, yearRoundData, availableWeeks } = analysisSeason
  const roundLoadError = analysisSeason.status === 'error'
  const recentForm = useRecentForm(existingMembers, asOfDate, cacheDay, { year: thisYear, quarter })
  const scoringStreakResult = useScoringStreak(totalMembers, asOfDate, existingMembers, cacheDay)
  const { recordsByYear, assistStreak: assistStreakStats, ...scoringStreakStats } = scoringStreakResult
  const scoringStreak = formatAttendanceStreak(scoringStreakStats, scoringStreakResult.status)
  const assistStreak = formatAttendanceStreak(assistStreakStats, scoringStreakResult.status)
  const longestAbsent = {
    ...scoringStreakResult.longestAbsent,
    status: scoringStreakResult.status,
    count: scoringStreakResult.longestAbsent.lastDate
      ? `마지막 출석 ${scoringStreakResult.longestAbsent.lastDate.replaceAll('-', '.')}` : '',
  }
  const dailyMaximums = useMemo(
    () => analyzeScoringRecords(recordsByYear, asOfDate),
    [recordsByYear, asOfDate],
  )
  const dailyGoalRecord = { ...dailyMaximums.goals, status: scoringStreakResult.status }
  const dailyAssistRecord = { ...dailyMaximums.assists, status: scoringStreakResult.status }
  const bestFive = useBestFive(thisYear, thisMonth, cacheDay, analysisSeason.records)
  const playerComparison = useMemo(() => analyzePlayerRadar(
    bestFive.records, existingMembers, thisMonth,
  ), [bestFive.records, existingMembers, thisMonth])
  const thisQuarterData = useMemo(() => getQuarterRoundGoals(yearRoundData, thisMonth), [yearRoundData, thisMonth])
  const [processedQuarterSource, setProcessedQuarterSource] = useState(null)
  const [processedWeeklyTeamSource, setProcessedWeeklyTeamSource] = useState(null)
  const [processedPartnerData, setProcessedPartnerData] = useState(null)
  const [mvpStatus, setMvpStatus] = useState('loading')
  const activePlayers = useMemo(() => [...existingMembers].sort((a, b) => a.localeCompare(b, 'ko')), [existingMembers])
  const [sonKaeDuo, setSonKaeDuo] = useState({})
  const [mostMvpPlayer, setMostMvpPlayer] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [mostPartnerPlayers, setMostPartnerPlayers] = useState({})
  const [mostMercenaryPlayer, setMostMercenaryPlayer] = useState({})
  const [tenTenClub, setTenTenClub] = useState({})
  const [twentyTwentyClub, setTwentyTwentyClub] = useState({})
  const [greedyPlayer, setGreedyPlayer] = useState({})
  const [altruisticPlayer, setAltruisticPlayer] = useState({})
  const [showIndividual, setShowIndividual] = useState(true)
  const [showSeason, setShowSeason] = useState(true)
  const [showCareer, setShowCareer] = useState(true)
  const starterPointRates = useMemo(() => analyzeStarterPointRate(
    yearRoundData,
    totalWeeklyTeamData,
    totalMembers,
    thisYear,
    thisMonth,
  ), [yearRoundData, totalWeeklyTeamData, totalMembers, thisYear, thisMonth])
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
    thisYear,
    thisMonth,
  ), [yearRoundData, totalWeeklyTeamData, existingMembers, thisYear, thisMonth])
  const winningTrio = winningTrioStats ? {
    name: [winningTrioStats.players.join(' - ')],
    count: `승률 ${Math.round(winningTrioStats.winRate * 100)}%`,
  } : {}
  const lowScoringDuoStats = useMemo(() => analyzeLowScoringDuo(
    thisQuarterData,
    totalWeeklyTeamData,
    totalMembers,
    thisYear,
    thisMonth,
    bestFive.memberInfo,
  ), [thisQuarterData, totalWeeklyTeamData, totalMembers, thisYear, thisMonth, bestFive.memberInfo])
  const lowScoringDuo = lowScoringDuoStats ? {
    name: lowScoringDuoStats.pairs.map(({ players }) => players.join(' - ')),
    count: `같은 팀 ${lowScoringDuoStats.pairs[0].sharedDays}회 · 합작 ${lowScoringDuoStats.pairs[0].goals}골`,
    duos: lowScoringDuoStats.pairs.map(({ players, sharedDays, goals }) => ({
      id: JSON.stringify(players), players, count: goals, sharedDays,
    })),
  } : {}

  const seasonCleanSheets = useMemo(() => yearRoundData && bestFive.memberInfo &&
    Array.isArray(totalWeeklyTeamData) && totalMembers.length > 0
    ? analyzeCleanSheets({
      roundYears: { [thisYear]: yearRoundData }, weeklyTeams: totalWeeklyTeamData,
      memberInfo: bestFive.memberInfo, members: totalMembers, oneCharacterMembers,
      nicknames: membersNickName, asOfDate,
    }) : null,
  [yearRoundData, thisYear, bestFive.memberInfo, totalWeeklyTeamData, totalMembers,
    oneCharacterMembers, membersNickName, asOfDate])
  const seasonCleanSheetCounts = seasonCleanSheets?.seasons.get(`${thisYear}-${quarter}`) || new Map()
  const seasonCleanSheetStatus = roundLoadError || bestFive.status === 'error' ? 'error'
    : seasonCleanSheets ? 'ready' : 'loading'
  const goalkeeperComparison = useMemo(() => seasonCleanSheets
    ? analyzeGoalkeeperRadar(playerComparison, bestFive.memberInfo,
      seasonCleanSheets.seasons.get(`${thisYear}-${quarter}`))
    : null,
  [seasonCleanSheets, playerComparison, bestFive.memberInfo, thisYear, quarter])

  const analysisItems = [
    {
      type: 'best-five',
      // isNew: true,
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
      type: 'clean-sheet', icon: 'goalkeeper', title: '최다 클린시트',
      data: { ...rankCareerCounts(seasonCleanSheetCounts, '회', true, Infinity), status: seasonCleanSheetStatus },
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
      // isNew: true,
      icon: 'rising',
      title: '최근 상승세',
      // description: '최근 출석 2회와 직전 2회의 공격포인트·승점 합계 비교',
      data: recentForm,
    },
    {
      type: 'recent-fall',
      // isNew: true,
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
      // isNew: true,
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
      // isNew: true,
      icon: 'streak',
      title: '꾸준한 피니셔',
      description: '출석할 때마다 골을 기록한 연속 횟수 Top 플레이어',
      data: scoringStreak,
    },
    {
      type: 'assist-streak',
      icon: 'playmaker',
      title: '꾸준한 플레이메이커',
      description: '출석할 때마다 어시를 기록한 연속 횟수 Top 플레이어',
      data: assistStreak,
    },
    {
      type: 'partners',
      icon: 'partners',
      title: '와이리 많이 봅니까 우리',
      description: '최다 같은 팀 듀오',
      data: mostPartnerPlayers,
    },
    {
      type: 'low-scoring-duo',
      // isNew: true,
      icon: 'handshake',
      title: '친해지자..',
      description: '같은 팀 횟수 대비 공격포인트가 가장 적은 듀오',
      data: lowScoringDuo,
    },
    {
      type: 'longest-absent',
      // isNew: true,
      icon: 'alarm',
      title: '깨어나세요..',
      description: '마지막 출석이 가장 오래된 플레이어',
      data: longestAbsent,
    },
    {
      type: 'daily-record',
      icon: 'dailyGoal',
      title: '일일 최다 골',
      // description: '통산 한 날짜 최다 득점 기록',
      data: dailyGoalRecord,
    },
    {
      type: 'daily-record',
      icon: 'dailyAssist',
      title: '일일 최다 어시',
      // description: '통산 한 날짜 최다 도움 기록',
      data: dailyAssistRecord,
    },
  ]

  const careerTypes = ['daily-record', 'scoring-streak', 'assist-streak', 'longest-absent']
  const seasonAnalysisItems = analysisItems.filter(({ type }) => !careerTypes.includes(type))

  // 개인별 데이터
  const [thisQuarterMVP, setThisQuarterMVP] = useState([])
  const [allTimeMVP, setAllTimeMVP] = useState([])
  const [careerRoundRequest, setCareerRoundRequest] = useState(1)
  const [historicalRoundData, setHistoricalRoundData] = useState(null)
  const [careerRoundStatus, setCareerRoundStatus] = useState('idle')
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
  const [selectedPlayerName, setSelectedPlayerName] = useState(null)
  const playerDetail = useMemo(() => {
    if (!selectedPlayerName) return null
    const shortName = selectedPlayerName.slice(1, 3)
    const detailMap = integratedData?.get(shortName) || {
      ...thisQuarterMostPartners?.[shortName],
      ...mercenaryBring?.get(shortName),
    }
    const rates = starterPointRates.playerRates.get(selectedPlayerName)
    const style = rates?.early > rates?.late ? ['얼리스타터']
      : rates?.late > rates?.early ? ['슬로우스타터'] : []
    const goals = Number(detailMap.goal ?? 0)
    const assists = Number(detailMap.assist ?? 0)
    style.push(Math.abs(goals - assists) <= 3 ? '밸런스' : goals > assists ? '득점선호' : '도움선호')
    const combi = []
    let maxPoint = 0
    thisQuarterPlayersCombination?.forEach((value, key) => {
      if (key.includes(shortName)) {
        const temp = key.split('_')
        if (temp[0] !== shortName) combi.push([temp[0], value])
        if (temp[1] !== shortName) combi.push([temp[1], value])
        if (value > maxPoint) maxPoint = value
      }
    })
    return {
      name: selectedPlayerName,
      mostPartner: detailMap.name || [],
      mostPartnerCount: detailMap.count || 0,
      style,
      mvp: thisQuarterMVP.filter((mvp) => mvp?.includes(selectedPlayerName)).length,
      mercenary: detailMap.mercenary || 0,
      combi: combi.filter((item) => item[1] === maxPoint).map((item) => item[0]),
      combiCount: maxPoint,
    }
  }, [selectedPlayerName, integratedData, thisQuarterMostPartners, mercenaryBring,
    starterPointRates, thisQuarterMVP, thisQuarterPlayersCombination])
  const playerName = playerDetail?.name
  const selectedMemberInfo = bestFive.memberInfo?.[playerName]
  const isGoalkeeper = selectedMemberInfo?.goalKeeper === true || selectedMemberInfo?.goalkeeper === true
  const [careerAwardHistory, setCareerAwardHistory] = useState({ status: 'idle', records: [] })
  const historyLoadedDay = useRef(null)
  const careerAwards = useMemo(() =>
    careerAwardHistory.status === 'ready' && playerName
      ? analyzeCareerAwards(careerAwardHistory.records, playerName, asOfDate)
      : [],
  [careerAwardHistory, playerName, asOfDate])
  const quarterPlayerStats = playerName ? playerComparison.players.get(playerName) : null
  const hasQuarterRecord = Boolean(quarterPlayerStats)
  const careerRecord = useMemo(() =>
    playerName && scoringStreakResult.status === 'ready'
      ? analyzeCareerRecords(recordsByYear, playerName, asOfDate)
      : null,
  [recordsByYear, playerName, scoringStreakResult.status, asOfDate])
  const careerStyle = careerRecord
    ? getCareerAttackStyle(careerRecord.totals.goals, careerRecord.totals.assists)
    : null
  const playerStartDate = bestFive.memberInfo?.[playerName]?.startDate
  const strongestSeasons = useMemo(() =>
    playerName && scoringStreakResult.status === 'ready'
      ? analyzePlayerSeasons(recordsByYear, playerName, asOfDate, playerStartDate)
      : [],
  [recordsByYear, playerName, scoringStreakResult.status, asOfDate, playerStartDate])
  const chartQuarters = useMemo(() =>
    careerRecord?.quarters.filter(({ year }) => year >= 2026) || [],
  [careerRecord])
  const careerRoundRoots = useMemo(() =>
    historicalRoundData && yearRoundData && analysisSeason.calendarYearRoundData
      ? { ...historicalRoundData, [thisYear]: yearRoundData, [calendarYear]: analysisSeason.calendarYearRoundData }
      : null,
  [historicalRoundData, yearRoundData, thisYear, calendarYear, analysisSeason.calendarYearRoundData])
  const careerCleanSheets = useMemo(() => careerRoundRoots && bestFive.memberInfo &&
    Array.isArray(totalWeeklyTeamData) && totalMembers.length > 0
    ? analyzeCleanSheets({
      roundYears: careerRoundRoots, weeklyTeams: totalWeeklyTeamData,
      memberInfo: bestFive.memberInfo, members: totalMembers, oneCharacterMembers,
      nicknames: membersNickName, asOfDate,
    }) : null,
  [careerRoundRoots, bestFive.memberInfo, totalWeeklyTeamData, totalMembers,
    oneCharacterMembers, membersNickName, asOfDate])
  const careerCleanSheetStatus = careerRoundStatus === 'error' || roundLoadError || bestFive.status === 'error' ? 'error'
    : careerRoundStatus === 'ready' && careerCleanSheets ? 'ready' : 'loading'
  const careerStarterStyles = useMemo(() =>
    careerRoundStatus === 'ready' && careerRoundRoots && !roundLoadError
      ? analyzeCareerStarterStyles(careerRoundRoots, totalWeeklyTeamData, totalMembers, asOfDate)
      : new Map(),
  [careerRoundStatus, careerRoundRoots, roundLoadError, totalWeeklyTeamData, totalMembers, asOfDate])
  const careerStyles = [careerStarterStyles.get(playerName), careerStyle].filter(Boolean)
  const careerPartners = useMemo(() =>
    playerName && Array.isArray(totalWeeklyTeamData)
      ? analyzeCareerPartners(totalWeeklyTeamData, careerRoundRoots || {}, playerName, totalMembers, asOfDate, oneCharacterMembers)
      : null,
  [totalWeeklyTeamData, careerRoundRoots, playerName, totalMembers, asOfDate, oneCharacterMembers])
  const careerMVPCount = allTimeMVP.filter((name) => name === playerName).length
  const careerMostMVP = useMemo(() => {
    const counts = new Map()
    for (const name of allTimeMVP) {
      if (typeof name !== 'string' || !name.trim() || name.includes('용병')) continue
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return { ...rankCareerCounts(counts, '회', true), status: mvpStatus }
  }, [allTimeMVP, mvpStatus])
  const careerDuo = useMemo(() => {
    const result = analyzeCareerGoalDuos(careerRoundRoots || {}, totalMembers, asOfDate, oneCharacterMembers)
    return {
      ...result,
      count: result.count > 0 ? formatCareerNumber(result.count, '골') : '',
      additionalCount: result.additionalCount > 0 ? formatCareerNumber(result.additionalCount, '골') : '',
      status: careerRoundStatus === 'error' || roundLoadError ? 'error'
        : careerRoundStatus === 'ready' && careerRoundRoots ? 'ready' : 'loading',
    }
  }, [careerRoundRoots, totalMembers, asOfDate, oneCharacterMembers, careerRoundStatus, roundLoadError])
  const careerAnalysisItems = [
    {
      type: 'career-total', icon: 'dailyGoal', title: '최다 누적 골',
      // description: '통산 최다 골',
      data: { ...dailyMaximums.totalGoals, status: scoringStreakResult.status },
    },
    {
      type: 'career-total', icon: 'dailyAssist', title: '최다 누적 어시',
      // description: '통산 최다 어시',
      data: { ...dailyMaximums.totalAssists, status: scoringStreakResult.status },
    },
    {
      type: 'career-total', icon: 'rising', title: '최다 누적 공격포인트',
      data: { ...dailyMaximums.totalAttackPoints, status: scoringStreakResult.status },
    },
    {
      type: 'career-total', icon: 'trophy', title: '최다 누적 승점',
      data: { ...dailyMaximums.totalPoints, status: scoringStreakResult.status },
    },
    {
      type: 'career-clean-sheet', icon: 'goalkeeper', title: '최다 누적 클린시트',
      titleNote: '라운드 기록이 도입된 2026년 이후',
      data: {
        ...rankCareerCounts(careerCleanSheets?.totals || new Map(), '회', true, Infinity),
        status: careerCleanSheetStatus,
      },
    },
    {
      type: 'career-total', icon: 'check', title: '최다 누적 출석',
      data: { ...dailyMaximums.totalAttendance, status: scoringStreakResult.status },
    },
    {
      type: 'career-mvp', icon: 'trophy', title: '최다 누적 MVP',
      // description: '통산 데일리 MVP 최다 플레이어',
      data: careerMostMVP,
    },
    {
      type: 'career-duo', icon: 'duo', title: '손케 듀오',
      description: '통산 합작 골이 가장 많은 듀오',
      data: careerDuo,
    },
    ...analysisItems.filter(({ type }) => type === 'daily-record'),
    {
      type: 'career-clean-sheet', icon: 'goalkeeper', title: '일일 최다 클린시트',
      data: {
        ...rankCareerCounts(careerCleanSheets?.dailyHigh || new Map(), '회', true, Infinity),
        status: careerCleanSheetStatus,
      },
    },
    ...careerTypes.filter((type) => type !== 'daily-record')
      .flatMap((careerType) => analysisItems.filter(({ type }) => type === careerType)),
  ]
  const careerHighRows = careerRecord ? [
    ...(isGoalkeeper ? [['클린시트', formatCleanSheetRecord(careerCleanSheetStatus,
      formatCareerHigh(careerCleanSheets?.careerHigh.get(playerName), '회'))]] : []),
    ['골', formatCareerHigh(careerRecord.careerHigh.goals, '골')],
    ['어시', formatCareerHigh(careerRecord.careerHigh.assists, '어시')],
    ['승점', formatCareerHigh(careerRecord.careerHigh.points, '점')],
    ['승점생산률', formatCareerHigh(careerRecord.careerHigh.pointRate, '점')],
  ] : []
  const careerTotalRows = careerRecord ? [
    ['출석', formatCareerNumber(careerRecord.totals.attendance, '회')],
    ...(isGoalkeeper ? [
      ['클린시트', formatCleanSheetRecord(careerCleanSheetStatus,
        formatCareerNumber(careerCleanSheets?.totals.get(playerName) || 0, '회'))],
      ['최다 실점 상대', formatCleanSheetRecord(careerCleanSheetStatus,
        formatMostConceded(careerCleanSheets?.concededTotals.get(playerName)))],
    ] : []),
    ['골', formatCareerNumber(careerRecord.totals.goals, '골')],
    ['어시', formatCareerNumber(careerRecord.totals.assists, '어시')],
    ['승점', careerRecord.careerHigh.points.season
      ? formatCareerNumber(careerRecord.totals.points, '점') : '기록 없음'],
    ['MVP', `${careerMVPCount}회`],
    ['최다 같은 팀', careerPartners?.sameTeam.partners.length
      ? `${careerPartners.sameTeam.partners.join(', ')} · ${careerPartners.sameTeam.count}회`
      : '기록 없음'],
  ] : []
  const careerGoalPartner = careerRoundStatus === 'error'
    ? '골 합작 기록을 불러오지 못했습니다.'
    : careerRoundStatus !== 'ready'
      ? '골 합작 기록을 불러오는 중입니다.'
      : careerPartners?.goalCombination.partners.length
        ? `${careerPartners.goalCombination.partners.join(', ')} · 합작 ${careerPartners.goalCombination.goals}골`
        : '기록 없음'
  const selectedFoot = selectedMemberInfo?.preferredFoot
  const preferredFootLabel = selectedFoot === 'L' ? '왼발'
    : selectedFoot === 'R' ? '오른발'
      : bestFive.memberInfo ? '정보 없음'
        : bestFive.status === 'error' ? '정보를 불러오지 못했습니다' : '불러오는 중'
  const startDate = selectedMemberInfo?.startDate
  const startDateParts = typeof startDate === 'string'
    ? /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(startDate) : null
  const startDateLabel = startDateParts ? `since ${startDateParts[1]}.${startDateParts[2]}` : null

  useEffect(() => {
    if (playerDetail && !playerDetailDialogRef.current?.open) {
      playerDetailDialogRef.current?.showModal()
    }
  }, [playerDetail])

  useEffect(() => {
    playerDetailDialogRef.current?.close()
    setSelectedPlayerName(null)
  }, [thisYear, quarter])

  useEffect(() => {
    if (!playerName || historyLoadedDay.current === cacheDay) return undefined
    historyLoadedDay.current = cacheDay
    let cancelled = false
    let completed = false
    getAnalysisHistoryRecords().then((records) => {
      if (!cancelled) {
        completed = true
        setCareerAwardHistory({ status: 'ready', records })
      }
    }).catch(() => {
      if (!cancelled) {
        completed = true
        historyLoadedDay.current = null
        setCareerAwardHistory({ status: 'error', records: [] })
      }
    })
    return () => {
      cancelled = true
      if (!completed) historyLoadedDay.current = null
    }
  }, [playerName, cacheDay])

  useEffect(() => {
    if (careerRoundRequest === 0) return undefined

    let cancelled = false
    const currentYear = Number(calendarYear)
    const olderYears = Array.from(
      { length: Math.max(0, currentYear - FIRST_RECORD_YEAR) },
      (_, index) => FIRST_RECORD_YEAR + index,
    )
    const database = getDatabase()
    setCareerRoundStatus('loading')

    Promise.all(olderYears.map(async (year) => {
      const value = await getCachedAnalysisData(`rtdb:${year}`, async () => {
        const snapshot = await get(ref(database, String(year)))
        return snapshot.val() || {}
      })
      return [year, value]
    })).then((entries) => {
      if (cancelled) return
      setHistoricalRoundData(Object.fromEntries(entries))
      setCareerRoundStatus('ready')
    }).catch(() => {
      if (!cancelled) setCareerRoundStatus('error')
    })

    return () => { cancelled = true }
  }, [careerRoundRequest, calendarYear, cacheDay])

  useEffect(() => {
    // 이번 시즌 기록은 한 주 이상의 경기 데이터가 있을 때 계산한다.
    if (availableWeeks >= 1) {
      const totalData = []
      thisQuarterData.forEach((data) => {
        Object.values(data[1]).forEach((value) => {
          totalData.push(value)
        })
      })
      const { combinations, leaders, chasing } = analyzeSeasonGoalDuos(totalData)
      setThisQuarterPlayersCombination(combinations)
      const duoName = ({ key }) => key.split('_').map((name) => getFullName(name) || name).join(' - ')
      const duoRecord = ({ key, count }) => ({
        id: key, count, players: key.split('_').map((name) => getFullName(name) || name),
      })
      setSonKaeDuo(leaders.length > 0 ? {
        name: leaders.map(duoName),
        count: `${leaders[0].count}골`,
        additional: chasing.map(duoName),
        additionalCount: chasing.length > 0 ? `${chasing[0].count}골` : '',
        duos: leaders.map(duoRecord),
        additionalDuos: chasing.map(duoRecord),
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
      setThisQuarterPointData(new Map())
      setThisQuarterDataByTime(new Map())
      setThisQuarterPlayersCombination(new Map())
    }
    setProcessedQuarterSource({ data: thisQuarterData, members: existingMembers })
  }, [thisQuarterData, existingMembers, availableWeeks])

  const getFullName = (name) => {
    for (let i = 0; i < existingMembers.length; i++) {
      if (existingMembers[i].includes(name)) {
        return existingMembers[i]
      }
    }
  }

  const applyDailyMVPData = useCallback((fetchedData) => {
    const lastDateId = asOfDate.slice(2).replaceAll('-', '')
    setAllTimeMVP(fetchedData.flatMap(({ id, data }) => {
      if (!/^\d{6}$/.test(id) || id > lastDateId) return []
      return Array.isArray(data.bestPlayers)
        ? data.bestPlayers.map((player) => player?.name).filter(Boolean)
        : typeof data.name === 'string' ? [data.name] : []
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
  }, [asOfDate, thisMonth, thisYear])

  useEffect(() => {
    let active = true
    const mvpRef = collection(db, 'daily_mvp')
    const apply = (records) => {
      if (active) applyDailyMVPData(records)
    }
    const fail = () => {
      if (active) setMvpStatus('error')
    }
    setMvpStatus('loading')
    if (getAnalysisCachePeriod().isSunday) {
      const unsubscribe = onSnapshot(mvpRef, (snapshot) => {
        const records = snapshot.docs.map((document) => ({
          id: document.id,
          data: document.data(),
        }))
        void setCachedAnalysisData('firestore:daily_mvp', records)
        apply(records)
      }, fail)
      return () => {
        active = false
        unsubscribe()
      }
    }

    getCachedAnalysisData('firestore:daily_mvp', async () => {
      const snapshot = await getDocsFromServer(mvpRef)
      return snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      }))
    }).then(apply).catch(fail)
    return () => { active = false }
  }, [applyDailyMVPData, cacheDay])

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
    } else {
      setMostMercenaryPlayer({})
    }
    setProcessedWeeklyTeamSource({ data: totalWeeklyTeamData, members: existingMembers, year: thisYear, month: thisMonth })
  }, [totalWeeklyTeamData, thisYear, thisMonth, existingMembers])

  useEffect(() => {
    if (Array.isArray(totalWeeklyTeamData) && existingMembers.length > 0) {
      getWeeklyTeamData()
    }
  }, [totalWeeklyTeamData, existingMembers, getWeeklyTeamData])

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
    Object.entries(data).forEach(([key, value]) => {
      let count = -1
      Object.values(value).forEach((num) => {
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

    const pairCounts = new Map()
    Object.entries(data).forEach(([player, partners]) => {
      Object.entries(partners).forEach(([partner, rawCount]) => {
        const count = Number(rawCount)
        if (!Number.isFinite(count) || count <= 0 || player === partner) return
        const names = [getFullName(player), getFullName(partner)]
        if (names.some((name) => !name)) return
        const pair = names.sort((a, b) => a.localeCompare(b, 'ko')).join(' - ')
        pairCounts.set(pair, Math.max(count, pairCounts.get(pair) || 0))
      })
    })
    const ranked = [...pairCounts].map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
    const topCount = ranked[0]?.count
    const leaders = ranked.filter(({ count }) => count === topCount)
    const nextCount = ranked.find(({ count }) => count < topCount)?.count
    const chasing = nextCount === undefined ? [] : ranked.filter(({ count }) => count === nextCount)
    const additional = chasing.length <= 2 ? chasing : []
    setMostPartnerPlayers(topCount === undefined ? {} : {
      name: leaders.length === 1 ? [leaders[0].name] : [],
      count: leaders.length === 1 ? `${topCount}회` : '',
      additional: additional.map(({ name }) => name),
      additionalCount: additional.length > 0 ? `${nextCount}회` : '',
    })
  }

  useEffect(() => {
    if (weeklyTeamData) {
      getMostPartner(weeklyTeamData)
    }
  }, [weeklyTeamData])

  const playerDetailHandler = (name) => {
    setSelectedPlayerName(name)
    if (careerRoundStatus === 'idle' || careerRoundStatus === 'error') {
      setCareerRoundRequest((request) => request + 1)
    }
  }

  const hasLoadError = analysisSeason.status === 'error' || bestFive.status === 'error' || mvpStatus === 'error'
  const isQuarterDataLoading = analysisSeason.status === 'loading' || bestFive.status === 'loading'
  const isDataLoading =
    yearRoundData === null ||
    !Array.isArray(totalWeeklyTeamData) ||
    totalMembers.length === 0 ||
    existingMembers.length === 0 ||
    mvpStatus === 'loading' ||
    bestFive.status === 'loading' ||
    recentForm.status === 'loading' ||
    scoringStreakResult.status === 'loading' ||
    processedQuarterSource?.data !== thisQuarterData ||
    processedQuarterSource?.members !== existingMembers ||
    processedWeeklyTeamSource?.data !== totalWeeklyTeamData ||
    processedWeeklyTeamSource?.members !== existingMembers ||
    processedWeeklyTeamSource?.year !== thisYear ||
    processedWeeklyTeamSource?.month !== thisMonth ||
    weeklyTeamData === null ||
    processedPartnerData !== weeklyTeamData ||
    thisQuarterMostPartners === null ||
    thisQuarterPointData === null ||
    thisQuarterDataByTime === null ||
    thisQuarterPlayersCombination === null ||
    mercenaryBring === null ||
    integratedData === null

  const renderAnalysisItem = ({ type, isNew, icon, title, titleNote, description, data }) => {
    const players = data.name?.filter(Boolean) ?? []
    const almostPlayers = data.additional?.filter(Boolean) ?? []
    const isChasingDuo = type === 'duo' || type === 'partners' || type === 'career-duo'
    const isAttendanceStreak = type === 'scoring-streak' || type === 'assist-streak'
    const isCleanSheet = type === 'clean-sheet' || type === 'career-clean-sheet'
    const hasChaserCount = isChasingDuo || isAttendanceStreak || isCleanSheet || type === 'career-total' || type === 'career-mvp'
    const trendPlayers = type === 'recent-fall' ? recentForm.decliners : recentForm.leaders

    return (
      <div key={title} className="py-5 first:pt-0">
        <dt className="flex flex-wrap items-center gap-2 font-bold">
          <AnalysisIcon name={icon} />
          <span className="relative inline-block font-dnf-forged">
            {title}
            {isNew && <NewBadge />}
          </span>
          {titleNote && <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">{titleNote}</span>}
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
        {description && <dd className="text-[12px] pl-7 mt-1 text-gray-500 dark:text-gray-400">{description}</dd>}
        {type === 'best-five' ? (
          <dd className="mt-4 pl-6" aria-live="polite">
            {data.status === 'loading' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">플레이어 기록을 불러오는 중입니다.</p>
            ) : data.status === 'error' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">플레이어 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
            ) : data.positions ? (
              <BestFiveCard positions={data.positions} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">이번 시즌 출석률 50% 이상인 플레이어가 없습니다.</p>
            )}
          </dd>
        ) : (isCleanSheet || isAttendanceStreak || type === 'longest-absent' || type === 'daily-record' || type?.startsWith('career-')) &&
          data.status !== 'ready' ? (
          <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
            {data.status === 'loading'
              ? isCleanSheet
                ? '클린시트 기록을 계산하는 중입니다.'
                : type === 'daily-record'
                  ? '일일 기록을 계산하는 중입니다.'
                  : type?.startsWith('career-')
                    ? '통산 기록을 계산하는 중입니다.'
                    : '전체 출석 기록을 불러오는 중입니다.'
              : isCleanSheet
                ? '클린시트 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'
                : type === 'daily-record'
                  ? '일일 기록을 계산하지 못했습니다.'
                  : type?.startsWith('career-')
                    ? '통산 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'
                    : '전체 출석 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'}
          </dd>
        ) : type === 'recent-form' || type === 'recent-fall' ? (
          <>
            <dd className="mt-2 pl-7" aria-live="polite">
              {recentForm.status === 'ready' && trendPlayers.length > 0 ? (
                <ul className="space-y-1">
                  {trendPlayers.map((player) => (
                    <li key={player.name} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-blueSignature dark:text-yellow-400 font-dnf-forged">{player.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        공포 {trendChangeFormatter.format(player.increase)} · 승점 {trendChangeFormatter.format(player.winPointIncrease)}
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
                        ? '-'
                        : `최근 공격포인트와 승점 합계의 ${type === 'recent-fall' ? '하락' : '상승'} 조건에 맞는 플레이어가 없습니다.`}
                </p>
              )}
            </dd>
          </>
        ) : type === 'duo' || type === 'low-scoring-duo' ? (
          <>
            <dd className="pl-7 mt-2 w-[90%]">
              {data.duos?.length > 0 ? (
                <DuoRecordList duos={data.duos} />
              ) : (
                <span className="font-semibold text-blueSignature dark:text-yellow-400 font-dnf-forged">-</span>
              )}
            </dd>
            {data.additionalDuos?.length > 0 && (
              <dd className="pl-7 mt-3 w-[90%]">
                <p className="mb-2 text-xs font-medium text-goal dark:text-rose-400">추격 듀오</p>
                <DuoRecordList duos={data.additionalDuos} muted />
              </dd>
            )}
          </>
        ) : (
          <>
            <dd className="pl-7 mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 w-[90%]">
              <span className="min-w-0 break-words font-semibold text-blueSignature dark:text-yellow-400 font-dnf-forged">
                {players.length > 0
                  ? players.join(
                      type === 'duo' || type === 'partners' || type === 'low-scoring-duo' || type === 'starter' || type === 'daily-record'
                        ? ' '
                        : ' ',
                    )
                  : type === 'daily-record' || type?.startsWith('career-')
                    ? '기록 없음'
                    : '-'}
              </span>
              {players.length > 0 && data.count && <span>·</span>}
              {players.length > 0 && data.count && <span className="text-sm">{data.count}</span>}
            </dd>
            {almostPlayers.length > 0 && (
              <dd className="flex flex-wrap pl-7 mt-2 gap-1 text-sm text-gray-500 dark:text-gray-400 animate-bounceUpDown">
                <p className="mr-2 font-medium text-goal dark:text-rose-400">
                  {isChasingDuo ? '추격 듀오' : hasChaserCount ? '추격자' : '달성 임박'}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span>{almostPlayers.join(!type ? ' ' : ' / ')}</span>
                  {hasChaserCount && data.additionalCount && <span>·</span>}
                  <span>
                    {hasChaserCount && data.additionalCount && `${data.additionalCount}`}
                  </span>
                </div>
              </dd>
            )}
            {isAttendanceStreak && data.allTimeRecord?.count > data.currentCount && (
              <dd className="pl-7 mt-2 text-xs text-gray-400 dark:text-gray-400">
                <p className="mr-2 font-medium text-green-800 dark:text-green-500">통산 최장기록</p>
                <div className="flex flex-wrap gap-1">
                  <span>{data?.allTimeRecord?.name?.join(', ')}</span>
                  <span>·</span>
                  <span>{data?.allTimeRecord?.count}일 연속</span>
                </div>
              </dd>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col px-2 pb-10 text-left">
      <>
        <section
          className={`border-y-2 border-gray-200 dark:border-gray-700 ${showIndividual ? 'pb-4' : ''}`}
          aria-labelledby="analysis-individual-title"
        >
          <AnalysisSectionHeading
            id="analysis-individual-title"
            controls="individual-analysis"
            title="개인별 기록"
            expanded={showIndividual}
            onToggle={() => setShowIndividual((current) => !current)}
          />
          <div id="individual-analysis" hidden={!showIndividual}>
            <div className="mt-3 grid grid-cols-4 items-center gap-x-1 gap-y-2">
              {activePlayers.length > 0 ? (
                activePlayers.map((player) => (
                  <button
                    type="button"
                    key={player}
                    className="min-w-0 truncate bg-transparent px-0 py-1 text-blueSignature dark:text-yellow-400 sm:px-2"
                    aria-haspopup="dialog"
                    aria-controls="player-detail-dialog"
                    onClick={() => playerDetailHandler(player)}
                  >
                    {player}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">등록된 플레이어가 없습니다.</p>
              )}
            </div>
          </div>
        </section>
        <dialog
          ref={playerDetailDialogRef}
          id="player-detail-dialog"
          aria-labelledby="player-detail-title"
          onClick={closeDialogOnBackdropClick}
          onClose={() => {
            playerSeasonDialogRef.current?.close()
            setSelectedPlayerName(null)
          }}
          className="m-auto max-h-[85vh] w-[min(92vw,36rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-left text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {playerDetail && (
            <div className="flex max-h-[85vh] flex-col">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-500">
                <div className="min-w-0">
                  <h3
                    id="player-detail-title"
                    className="flex flex-wrap items-center gap-2 break-words text-lg font-bold font-dnf-forged text-blue-700 dark:text-blue-400"
                  >
                    <span>{playerDetail.name}</span>
                    <GoalkeeperBadge memberInfo={selectedMemberInfo} />
                    {selectedMemberInfo?.injured === true && (
                      <span className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-0.5 font-sans text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
                        부상중
                      </span>
                    )}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{preferredFootLabel}</span>
                    {startDateLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="whitespace-nowrap">
                          <span className="sr-only">가입일 </span>
                          <time dateTime={startDate} title="가입일">
                            {startDateLabel}
                          </time>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <form method="dialog" className="shrink-0">
                  <button type="submit" className="rounded px-2 py-1 text-xl">
                    X
                  </button>
                </form>
              </div>
              <div className="player-detail-scroll min-h-0 px-7 pb-5">
                <div className="mt-4">
                  <h4 className="sticky top-0 z-10 -mx-7 mb-3 border-b border-gray-100 bg-white px-7 py-2 font-semibold font-dnf-forged dark:border-gray-700 dark:bg-gray-900">
                    이번 시즌
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {thisYear}년 {quarter}분기
                    </span>
                  </h4>
                  {bestFive.status === 'ready' && (!isGoalkeeper || seasonCleanSheetStatus === 'ready') ? (
                    hasQuarterRecord ? (
                      <PlayerRadarChart name={playerDetail.name} comparison={isGoalkeeper ? goalkeeperComparison : playerComparison} />
                    ) : (
                      <p className="flex items-center justify-center mt-6 h-40 text-sm text-center text-gray-500 dark:text-gray-400">
                        이번 시즌 기록이 없습니다
                      </p>
                    )
                  ) : (
                    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400" role="status">
                      {bestFive.status === 'error' || (isGoalkeeper && seasonCleanSheetStatus === 'error')
                        ? '비교 기록을 불러오지 못했습니다.' : '비교 기록을 불러오는 중입니다.'}
                    </p>
                  )}
                  <hr className="my-5 border-gray-100 dark:border-gray-700" />
                  {bestFive.status === 'ready' && hasQuarterRecord && (
                    <dl className="space-y-2 text-sm">
                      {[
                        ...(isGoalkeeper ? [
                          ['클린시트', formatCleanSheetRecord(seasonCleanSheetStatus,
                            formatCareerNumber(seasonCleanSheetCounts.get(playerName) || 0, '회'))],
                          ['최다 실점 상대', formatCleanSheetRecord(seasonCleanSheetStatus,
                            formatMostConceded(seasonCleanSheets?.concededSeasons.get(`${thisYear}-${quarter}`)?.get(playerName)))],
                        ] : []),
                        ['골', formatCareerNumber(quarterPlayerStats.goals, '골')],
                        ['어시', formatCareerNumber(quarterPlayerStats.assists, '어시')],
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
                        <Fragment key={label}>
                          <div className="flex gap-4">
                            <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                            <dd className={'min-w-0 break-words ' + (label === '스타일' && '[word-spacing:6px]')}>{value}</dd>
                          </div>
                          <hr className="border-gray-100 dark:border-gray-700" />
                        </Fragment>
                      ))}
                    </dl>
                  )}
                </div>
                <hr className="my-5 border-gray-700 dark:border-gray-200" />
                <section aria-labelledby="career-record-title">
                  {careerRecord ? (
                    <>
                      <div>
                        <h4
                          id="career-record-title"
                          className="sticky top-0 z-10 -mx-7 mb-4 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-7 py-2 font-semibold font-dnf-forged dark:border-gray-700 dark:bg-gray-900"
                        >
                          <span>통산 기록</span>
                        </h4>
                        <dl className="space-y-2 text-sm">
                          {careerTotalRows.map(([label, value]) => (
                            <Fragment key={label}>
                              <div className="flex gap-4">
                                <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                                <dd className="min-w-0 break-words">{value}</dd>
                              </div>
                              <hr className="border-gray-100 dark:border-gray-700" />
                            </Fragment>
                          ))}
                          <div className="flex gap-4">
                            <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">최다 골 합작</dt>
                            <dd className="min-w-0 break-words" role={careerRoundStatus === 'loading' ? 'status' : undefined}>
                              {careerGoalPartner}
                            </dd>
                          </div>
                          <hr className="border-gray-100 dark:border-gray-700" />
                          {(careerAwardHistory.status !== 'ready' || careerAwards.length > 0) && (
                            <>
                              <div className="flex gap-4">
                                <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">개인 수상</dt>
                                <dd className="min-w-0 break-words" role={careerAwardHistory.status === 'idle' ? 'status' : undefined}>
                                  {careerAwardHistory.status === 'error' ? (
                                    '수상 기록을 불러오지 못했습니다.'
                                  ) : careerAwardHistory.status === 'idle' ? (
                                    '수상 기록을 불러오는 중입니다.'
                                  ) : (
                                    <ul className="flex flex-col gap-1">
                                      {careerAwards.map((award) => {
                                        const [title, count] = award.split('x')
                                        return (
                                          <li
                                            key={award}
                                            className={
                                              'flex items-center gap-1 whitespace-nowrap relative ' +
                                              (!['득점왕', '승점왕'].includes(title) && 'left-[-4px]')
                                            }
                                          >
                                            <AwardIconStack title={title} count={count} />
                                            <span>
                                              {title}
                                              <span className="ml-0.5 text-[10px]">x{count}</span>
                                            </span>
                                          </li>
                                        )
                                      })}
                                    </ul>
                                  )}
                                </dd>
                              </div>
                              <hr className="border-gray-100 dark:border-gray-700" />
                            </>
                          )}
                          <div className="flex gap-4">
                            <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400 flex items-center">스타일</dt>
                            <dd className="min-w-0 break-words">
                              {careerStyles.length > 0 || strongestSeasons.length > 0 ? (
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  {careerStyles.map((style) => (
                                    <span key={style} className="whitespace-nowrap">
                                      #{style}
                                    </span>
                                  ))}
                                  {strongestSeasons.length > 0 && (
                                    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
                                      {strongestSeasons.map((season) => (
                                        <span
                                          key={season.key}
                                          title={`${season.label} · 승점생산률 ${careerNumberFormatter.format(season.pointRate)}점 (${careerNumberFormatter.format(season.points)}승점 / ${careerNumberFormatter.format(season.games)}경기 · 출석 ${season.attendance}회, 2026년부터 누적)`}
                                          className={`inline-flex items-center gap-1 whitespace-nowrap font-sans text-sm font-medium ${playerSeasonTextColors[season.key]}`}
                                        >
                                          <span>#</span>
                                          <img
                                            src={playerSeasonIcons[season.key]}
                                            alt=""
                                            width="28"
                                            height="28"
                                            className="h-7 w-7 shrink-0 object-contain"
                                          />
                                          <span>사나이</span>
                                        </span>
                                      ))}
                                      <button
                                        type="button"
                                        className={`${detailsButtonClass} !ml-0 !text-sm shrink-0 whitespace-nowrap font-sans`}
                                        aria-label="개인 최고 계절 선정 기준 자세히 보기"
                                        aria-haspopup="dialog"
                                        aria-controls="player-season-method-dialog"
                                        onClick={() => playerSeasonDialogRef.current?.showModal()}
                                      >
                                        자세히 보기
                                      </button>
                                    </span>
                                  )}
                                </span>
                              ) : (
                                '기록 없음'
                              )}
                            </dd>
                          </div>
                          <hr className="border-gray-100 dark:border-gray-700" />
                        </dl>
                      </div>
                      <hr className="my-5 border-gray-700 dark:border-gray-200" />
                      <div>
                        <div className="sticky top-0 z-10 -mx-7 mb-4 flex flex-row items-center gap-2 border-b border-gray-100 bg-white px-7 py-2 dark:border-gray-700 dark:bg-gray-900">
                          <h4 id="career-high-title" className="font-semibold font-dnf-forged">
                            커리어 하이
                          </h4>
                          <span className="relative top-1 text-[11px] text-gray-500 dark:text-gray-400">항목별</span>
                        </div>
                        <dl className="space-y-2 text-sm">
                          {careerHighRows.map(([label, value]) => (
                            <Fragment key={label}>
                              <div className="flex gap-4">
                                <dt className="w-24 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                                <dd className="min-w-0 break-words">{value}</dd>
                              </div>
                              <hr className="border-gray-100 dark:border-gray-700" />
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400" role="status">
                      {scoringStreakResult.status === 'error' ? '통산 기록을 불러오지 못했습니다.' : '통산 기록을 불러오는 중입니다.'}
                    </p>
                  )}
                </section>
                {careerRecord && (
                  <section className="mt-5 border-t border-gray-700 pt-5 dark:border-gray-200" aria-labelledby="quarterly-record-title">
                    <div className="sticky top-0 z-10 -mx-7 mb-3 flex flex-row items-center gap-2 border-b border-gray-100 bg-white px-7 py-2 dark:border-gray-700 dark:bg-gray-900">
                      <h4 id="quarterly-record-title" className="font-semibold font-dnf-forged">
                        분기 추세
                      </h4>
                      <span className="relative top-1 text-[11px] text-gray-500 dark:text-gray-400">항목별 최고 분기 대비 (승점제 도입 이후)</span>
                    </div>
                    {chartQuarters.length > 0 ? (
                      <QuarterlyRecordChart
                        quarters={chartQuarters}
                        currentQuarterKey={`${asOfDate.slice(0, 4)}-${Math.ceil(Number(asOfDate.slice(5, 7)) / 3)}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">2026년 1분기 이후 기록이 없습니다.</p>
                    )}
                  </section>
                )}
              </div>
            </div>
          )}
        </dialog>
        <dialog
          ref={playerSeasonDialogRef}
          id="player-season-method-dialog"
          aria-labelledby="player-season-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-left text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="flex max-h-[85vh] flex-col">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 id="player-season-method-title" className="text-lg font-bold">
                개인 최고 계절 선정 기준
              </h3>
              <form method="dialog" className="shrink-0">
                <button type="submit" className="rounded px-2 py-1 text-sm text-blue-700 hover:underline dark:text-yellow-400">
                  닫기
                </button>
              </form>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
              <p>본인의 승점 생산률이 가장 높은 계절을 표시합니다.</p>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold">집계 기간</dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-300">2026년 1월부터 현재까지의 기록을 계절별로 누적합니다.</dd>
                </div>
                <div>
                  <dt className="font-semibold">계절 구분</dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-300">봄 3~5월 · 여름 6~8월 · 가을 9~11월 · 겨울 12~2월</dd>
                </div>
                <div>
                  <dt className="font-semibold">승점 생산률</dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-300">계절별 총승점 ÷ 총경기 수로 계산합니다.</dd>
                </div>
                <div>
                  <dt className="font-semibold">출석 조건</dt>
                  <dd className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                    <p>기존 회원은 네 계절 모두 2회 이상 출석해야 비교합니다.</p>
                    <p>올해 가입자는 2회 이상 출석한 계절만 비교합니다.</p>
                    <p>승점과 경기 수가 확인되는 출석일을 기준으로 하며, 같은 날짜는 한 번으로 계산합니다.</p>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">동률 처리</dt>
                  <dd className="mt-1 text-gray-600 dark:text-gray-300">승점 생산률이 공동 최고인 계절은 모두 표시합니다.</dd>
                </div>
              </dl>
            </div>
          </div>
        </dialog>
        <section aria-labelledby="analysis-season-title">
          <AnalysisSectionHeading
            id="analysis-season-title"
            controls="season-analysis"
            title="이번 시즌"
            subtitle={`${thisYear} - 제 ${quarter} 시즌`}
            expanded={showSeason}
            onToggle={() => setShowSeason((current) => !current)}
          />
          <div id="season-analysis" hidden={!showSeason} className="pt-4">
            {hasLoadError ? (
              <div className="py-8 text-center" role="alert">
                이번 시즌 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.
              </div>
            ) : isQuarterDataLoading || (availableWeeks >= 1 && isDataLoading) ? (
              <div className="py-8 text-center" role="status">
                이번 시즌 데이터를 불러오는 중입니다.
              </div>
            ) : availableWeeks === 0 ? (
              <div className="pb-8 pt-4 h-40 flex items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400" role="status">
                이번 시즌 데이터가 없습니다.
              </div>
            ) : (
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">{seasonAnalysisItems.map(renderAnalysisItem)}</dl>
            )}
          </div>
        </section>
        <section aria-labelledby="analysis-career-title">
          <AnalysisSectionHeading
            id="analysis-career-title"
            controls="career-analysis"
            title="통산 기록"
            expanded={showCareer}
            onToggle={() => setShowCareer((current) => !current)}
            borderTop
          />
          <div id="career-analysis" hidden={!showCareer} className="pt-4">
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">{careerAnalysisItems.map(renderAnalysisItem)}</dl>
          </div>
        </section>

        <dialog
          ref={bestFiveDialogRef}
          id="best-five-method-dialog"
          aria-labelledby="best-five-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-left text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 id="best-five-method-title" className="text-lg font-bold">
              BEST Ⅴ
            </h3>
            <form method="dialog">
              <button type="submit" className="rounded px-2 py-1 text-xl">
                X
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>이번 시즌 출석일의 50% 이상 참석한 플레이어 중</p>
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
          <div className="flex items-center justify-between gap-4">
            <h3 id="recent-form-method-title" className="text-lg font-bold">
              최근 상승세·하락세 계산 방식
            </h3>
            <form method="dialog">
              <button type="submit" className="rounded px-2 py-1 text-xl">
                X
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>플레이어별 최근 출석 2회와 그 직전 출석 2회의 승점생산률과 공격포인트를 비교합니다.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>상승세: 두 지표 중 하나 이상 증가하고, 다른 지표는 감소하지 않은 플레이어</li>
              <li>하락세: 두 지표 중 하나 이상 감소하고, 다른 지표는 증가하지 않은 플레이어</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400">이번 시즌 2회 이상, 8주 이내에 총 4회 이상 출석해야 합니다.</p>
          </div>
        </dialog>
      </>
    </div>
  )
}

export default AnalysisTap
