import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { get, getDatabase, ref } from 'firebase/database'

import NewBadge from '@/components/atoms/NewBadge.jsx'
import ReturnBadge from '@/components/atoms/ReturnBadge.jsx'
import GoalkeeperBadge from '@/components/atoms/GoalkeeperBadge.jsx'
import ScrollToTopButton from '@/components/atoms/ScrollToTopButton.jsx'
import BestFiveCard from '@/components/organisms/BestFiveCard.jsx'
import CareerRankingDialog from '@/components/organisms/CareerRankingDialog.jsx'
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
import useCareerClickHint from '@/hooks/useCareerClickHint.js'
import { getQuarterRoundGoals } from '@/apis/roundGoals.js'
import { createRecordMemberResolver } from '@/apis/recordMembers.js'
import { analyzeStarterStats } from '@/apis/analyzeStarterStats.js'
import { analyzeStarterPointRate, analyzeCareerStarterStyles } from '@/apis/analyzeStarterPointRate.js'
import { analyzeWinningTrio } from '@/apis/analyzeWinningTrio.js'
import { analyzeLowScoringDuo } from '@/apis/analyzeLowScoringDuo.js'
import { analyzeSeasonGoalDuos } from '@/apis/analyzeSeasonGoalDuos.js'
import { analyzeGoalkeeperRadar, analyzePlayerRadar } from '@/apis/analyzePlayerRadar.js'
import { analyzeCareerRecords, getCareerAttackStyle } from '@/apis/analyzeCareerRecords.js'
import { analyzeCareerPointRate } from '@/apis/analyzeCareerPointRate.js'
import { analyzeCareerRankings } from '@/apis/analyzeCareerRankings.js'
import { analyzeCleanSheets } from '@/apis/analyzeCleanSheets.js'
import { analyzePlayerSeasons, analyzeSeasonSpecialists } from '@/apis/analyzePlayerSeasons.js'
import { analyzeCareerGoalDuos, analyzeCareerPartners } from '@/apis/analyzeCareerPartners.js'
import { analyzeCareerAwards, analyzeCareerAwardLeaders, analyzeTitleCollections } from '@/apis/analyzeCareerAwards.js'
import { getAnalysisHistoryRecords } from '@/apis/analysisHistoryRecords.js'
import { getAnalysisCachePeriod, getCachedAnalysisData, setCachedAnalysisData } from '@/apis/analysisDataCache.js'
import goldenBoot from '@/assets/optimized/analysis/golden-boot.webp'
import ballonDor from '@/assets/optimized/analysis/ballon-dor.webp'
import ligueOne from '@/assets/optimized/analysis/ligue-1.webp'
import coppaItalia from '@/assets/optimized/analysis/coppa-italia.webp'
import goalkeeperGloves from '@/assets/optimized/analysis/goalkeeper-gloves.webp'
import seasonMvpTrophy from '@/assets/optimized/analysis/trophy2.webp'
import goldenGlove from '@/assets/optimized/analysis/gloves.webp'
import tenClubMedal from '@/assets/optimized/analysis/10-10.webp'
import twentyClubMedal from '@/assets/optimized/analysis/20-20.webp'
import bestFiveIcon from '@/assets/optimized/analysis/best5.webp'
import risingFormIcon from '@/assets/optimized/analysis/up-up.webp'
import earlyStarterIcon from '@/assets/optimized/analysis/early2.webp'
import slowStarterIcon from '@/assets/optimized/analysis/slow-starter.webp'
import trioIcon from '@/assets/optimized/analysis/trio-mosaic.webp'
import careerGoalTopIcon from '@/assets/optimized/analysis/career-goal-top.webp'
import careerAssistTopIcon from '@/assets/optimized/analysis/career-assist-top.webp'
import dailyGoalIcon from '@/assets/optimized/analysis/daily-goal-record.webp'
import dailyAssistIcon from '@/assets/optimized/analysis/daily-assist-record.webp'
import dailyCleanSheetIcon from '@/assets/optimized/analysis/daily-clean-sheet-record.webp'
import dailyAttackPointsIcon from '@/assets/optimized/analysis/daily-attack-points-record.webp'
import careerMvpTopIcon from '@/assets/optimized/analysis/career-mvp-top.webp'
import careerAttendanceTopIcon from '@/assets/optimized/analysis/career-attendance-top.webp'
import consistentFinisherIcon from '@/assets/optimized/analysis/consistent-finisher.webp'
import consistentPlaymakerIcon from '@/assets/optimized/analysis/consistent-playmaker.webp'
import careerPointsTopIcon from '@/assets/optimized/analysis/career-points-top.webp'
import careerPointRateTopIcon from '@/assets/optimized/analysis/career-point-rate-top.webp'
import careerAttackPointsTopIcon from '@/assets/optimized/analysis/career-attack-points-top.webp'
import titleCollectionIcon from '@/assets/optimized/analysis/all-collection.webp'
import titleDoubleIcon from '@/assets/optimized/analysis/title-double.webp'
import titleTrebleIcon from '@/assets/optimized/analysis/title-treble.webp'
import titleQuadrupleIcon from '@/assets/optimized/analysis/title-quadruple.webp'
import seasonAcesIcon from '@/assets/optimized/analysis/season-ball.webp'
import careerAwardLeadersIcon from '@/assets/optimized/analysis/career-award-leaders.webp'
import sonKaeDuoIcon from '@/assets/optimized/analysis/sonkae-hug.webp'
import friendlyDuoIcon from '@/assets/optimized/analysis/friendly.webp'
import wakeUpIcon from '@/assets/optimized/analysis/wake-up.webp'
import springBallIcon from '@/assets/optimized/analysis/spring-ball.webp'
import summerBallIcon from '@/assets/optimized/analysis/summer-ball.webp'
import autumnBallIcon from '@/assets/optimized/analysis/fall-ball.webp'
import winterBallIcon from '@/assets/optimized/analysis/winter-ball.webp'
import springIcon from '@/assets/optimized/analysis/spring-cherry-blossom-3d.webp'
import summerIcon from '@/assets/optimized/analysis/summer-sun-3d.webp'
import autumnIcon from '@/assets/optimized/analysis/autumn-maple-leaf-3d.webp'
import winterIcon from '@/assets/optimized/analysis/winter-snowflake-3d.webp'
import ChevronRightIcon from '@/assets/lucide/chevron-right.svg?react'
import './AnalysisTap.css'

const FIRST_RECORD_YEAR = 2021
const careerRankingKeys = {
  careerGoalTop: 'goals',
  careerAssistTop: 'assists',
  careerAttackPointsTop: 'attackPoints',
  careerPointsTop: 'points',
  careerPointRateTop: 'pointRate',
  goldenGlove: 'cleanSheets',
  careerAttendanceTop: 'attendance',
  careerMvpTop: 'mvp',
  duo: 'duos',
  streak: 'scoringStreak',
  playmaker: 'assistStreak',
  point_king: 'award-point_king',
  goal_king: 'award-goal_king',
  assist_king: 'award-assist_king',
  attendance_king: 'award-attendance_king',
}
const careerRankingDescriptions = {
  // goals: '전체 기간의 누적 골 순위입니다.',
  // assists: '전체 기간의 누적 어시 순위입니다.',
  // attackPoints: '전체 기간의 골과 어시를 합산한 순위입니다.',
  // points: '승점제가 시작된 2026년 이후의 누적 승점 순위입니다.',
  pointRate: '승점제 도입 2026년부터 70% 이상 출석한 선수 대상',
  // cleanSheets: '2026년 이후 기록된 라운드의 누적 클린시트 순위입니다.',
  // attendance: '부분 출석을 포함한 전체 출석 기록의 합계입니다.',
  // mvp: '전체 기간의 데일리 MVP 수상 횟수입니다.',
  // duos: '전체 기간에 두 선수가 골과 어시로 합작한 골의 수입니다.',
  // scoringStreak: '현재 이어지는 연속 출석 득점 횟수입니다. 불참은 유지되며, 출석한 날 골이 없으면 끊깁니다.',
  // assistStreak: '현재 이어지는 연속 출석 어시 횟수입니다. 불참은 유지되며, 출석한 날 어시가 없으면 끊깁니다.',
}
const groupAnalysisRows = (items) => items.reduce((rows, item) => {
  const previousRow = rows[rows.length - 1]
  if (item.layoutGroup && previousRow?.key === item.layoutGroup) {
    previousRow.items.push(item)
  } else {
    rows.push({ key: item.layoutGroup || item.title, items: [item] })
  }
  return rows
}, [])
const playerSeasonIcons = { spring: springIcon, summer: summerIcon, autumn: autumnIcon, winter: winterIcon }
const analysisImageIcons = {
  spring: springBallIcon,
  summer: summerBallIcon,
  autumn: autumnBallIcon,
  winter: winterBallIcon,
  seasonMvp: seasonMvpTrophy,
  goldenGlove,
  ten: tenClubMedal,
  twenty: twentyClubMedal,
  bestFive: bestFiveIcon,
  seasonRising: risingFormIcon,
  early: earlyStarterIcon,
  late: slowStarterIcon,
  trio: trioIcon,
  careerGoalTop: careerGoalTopIcon,
  careerAssistTop: careerAssistTopIcon,
  dailyGoal: dailyGoalIcon,
  dailyAssist: dailyAssistIcon,
  dailyCleanSheet: dailyCleanSheetIcon,
  dailyAttackPoints: dailyAttackPointsIcon,
  careerMvpTop: careerMvpTopIcon,
  careerAttendanceTop: careerAttendanceTopIcon,
  streak: consistentFinisherIcon,
  playmaker: consistentPlaymakerIcon,
  careerPointsTop: careerPointsTopIcon,
  careerPointRateTop: careerPointRateTopIcon,
  careerAttackPointsTop: careerAttackPointsTopIcon,
  titleCollection: titleCollectionIcon,
  double: titleDoubleIcon,
  treble: titleTrebleIcon,
  quadruple: titleQuadrupleIcon,
  seasonAces: seasonAcesIcon,
  careerAwardLeaders: careerAwardLeadersIcon,
  point_king: ballonDor,
  goal_king: goldenBoot,
  assist_king: ligueOne,
  attendance_king: coppaItalia,
  seasonDuo: sonKaeDuoIcon,
  duo: sonKaeDuoIcon,
  handshake: friendlyDuoIcon,
  alarm: wakeUpIcon,
}
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
  도움왕: ligueOne,
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
const InlinePlayerRecords = ({ names, count, muted = false }) => (
  <span className="flex w-full min-w-0 flex-col items-center gap-1">
    {names.map((name) => (
      <span key={name} className="inline-flex max-w-full items-baseline justify-center gap-x-0.5 whitespace-nowrap text-[clamp(11px,3.4vw,14px)] tracking-tight">
        <span className={`font-dnf-forged ${muted ? '' : 'font-semibold text-zinc-700 dark:text-zinc-200'}`}>{name}</span>
        {count && <span className="tabular-nums">{count}</span>}
      </span>
    ))}
  </span>
)
const careerNumberFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const formatCareerNumber = (value, unit) => `${careerNumberFormatter.format(value)}${unit}`
const formatCareerHigh = (high, unit) => high?.season
  ? formatCareerNumber(high.value, unit)
  : '기록 없음'
const formatCleanSheetRecord = (status, value) => status === 'ready' ? value
  : status === 'error' ? '기록을 불러오지 못했습니다.' : '기록을 불러오는 중입니다.'
const formatMostConceded = (counts, eligibleMembers) => {
  const eligibleCounts = [...(counts || [])].filter(([name]) => eligibleMembers.has(name))
  const maximum = Math.max(0, ...eligibleCounts.map(([, count]) => count))
  if (maximum === 0) return '기록 없음'
  const names = eligibleCounts.filter(([, count]) => count === maximum)
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

const rankCareerCounts = (counts, unit, includeChasers = false, maxChasers = 2, eligibleMembers = null) => {
  if (eligibleMembers) counts = new Map([...counts].filter(([name]) => eligibleMembers.has(name)))
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

const analyzeScoringRecords = (recordsByYear, asOfDate, eligibleMembers) => {
  const totals = new Map()
  const pointTotals = new Map()
  const attendanceTotals = new Map()
  const maxima = {
    goals: { field: '골', unit: '골', value: 0, names: new Set() },
    assists: { field: '어시', unit: '어시', value: 0, names: new Set() },
  }
  const attackPointMaximum = { unit: '점', value: 0, names: new Set() }
  const updateMaximum = (maximum, name, value) => {
    if (!Number.isFinite(value) || value <= 0) return
    if (value > maximum.value) {
      maximum.value = value
      maximum.names = new Set([name])
    } else if (value === maximum.value) {
      maximum.names.add(name)
    }
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
        if (!name.trim() || name.includes('용병') || !eligibleMembers.has(name)) continue
        const points = Number(stats?.['승점'])
        if (Number.isFinite(points) && points > 0) {
          pointTotals.set(name, (pointTotals.get(name) || 0) + points)
        }
        const attackPoints = ['골', '어시'].reduce((sum, field) => {
          const value = Number(stats?.[field])
          return sum + (Number.isFinite(value) && value > 0 ? value : 0)
        }, 0)
        updateMaximum(attackPointMaximum, name, attackPoints)
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
          updateMaximum(maximum, name, value)
        }
      }
    }
  }

  const daily = Object.fromEntries(Object.entries({
    ...maxima, attackPoints: attackPointMaximum,
  }).map(([key, maximum]) => [key, {
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

const AnalysisIcon = ({ name }) => analysisImageIcons[name] ? (
  <img
    src={analysisImageIcons[name]}
    alt=""
    className={`${name === 'handshake' ? 'h-10 w-10' : 'h-7 w-7'} shrink-0 object-contain`}
  />
) : name === 'goalkeeper' ? (
  <GoalkeeperBadge memberInfo={{ goalKeeper: true }} className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-200" />
) : (
  <svg
    aria-hidden="true"
    focusable="false"
    className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-200"
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

const AnalysisSectionHeading = ({ id, controls, title, subtitle, expanded, onToggle, focused = false }) => (
  <div className="analysis-section-heading sticky top-0 z-20 w-full">
    <h2 id={id} className="w-full">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controls}
        title={focused ? '목록으로 돌아가기' : undefined}
        onClick={onToggle}
        className="analysis-section-toggle bg-blue-50 relative flex h-[var(--analysis-section-heading-height)] w-full items-center justify-center px-12 py-3 text-center font-dnf-forged"
      >
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold">{title}</span>
          {subtitle && <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{subtitle}</span>}
        </span>
        <span aria-hidden="true" className={`analysis-section-toggle__chevron absolute flex h-7 w-7 items-center justify-center rounded-full ${focused ? 'left-4' : 'right-4'}`}>
          <ChevronRightIcon className={`h-4 w-4 transition-transform motion-reduce:transition-none ${focused ? 'rotate-180' : expanded ? 'rotate-90' : ''}`} />
        </span>
      </button>
    </h2>
  </div>
)

const trendChangeFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

const detailsButtonClass = 'rounded px-1 py-0.5 text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-zinc-200 dark:hover:text-zinc-100'

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
  { key: 'goleiro', label: 'GK', description: '골키퍼', metric: 'cleanSheets' },
]

const AnalysisTap = (props) => {
  const { test } = props
  const { showHint: showCareerClickHint, recordClick: recordCareerCardClick } = useCareerClickHint()
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)
  useEffect(() => {
    const onPointerDown = () => setKeyboardNavigation(false)
    const onKeyDown = (event) => {
      if (['Tab', 'Enter', ' ', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
        setKeyboardNavigation(true)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])
  const { existingMembers: listedExistingMembers, retiredMembers, totalMembers, oneCharacterMembers, membersNickName } = getMembers()
  const existingMembers = useMemo(() => {
    const retired = new Set(retiredMembers)
    return [...new Set(listedExistingMembers)].filter((name) => !retired.has(name))
  }, [listedExistingMembers, retiredMembers])
  const eligibleMembers = useMemo(() => new Set(existingMembers), [existingMembers])
  // Resolve historical short names against everyone before checking current eligibility.
  const resolveRecordMember = useMemo(() => createRecordMemberResolver(
    totalMembers, oneCharacterMembers, membersNickName,
  ), [totalMembers, oneCharacterMembers, membersNickName])
  const getFullName = useCallback((name) => {
    const resolved = resolveRecordMember(name)
    return eligibleMembers.has(resolved) ? resolved : null
  }, [resolveRecordMember, eligibleMembers])
  const { time: { currentTime } } = getTimes()
  const cacheDay = getAnalysisCachePeriod(currentTime).dayKey
  const calendarYear = test ? '2024' : cacheDay.slice(0, 4)
  const currentMonth = Number(cacheDay.slice(5, 7))
  const { totalWeeklyTeamData } = getRecords()
  const recentFormDialogRef = useRef(null)
  const bestFiveDialogRef = useRef(null)
  const playerDetailDialogRef = useRef(null)
  const playerSeasonDialogRef = useRef(null)
  const seasonSpecialistDialogRef = useRef(null)
  const careerRankingDialogRef = useRef(null)
  const [selectedCareerRanking, setSelectedCareerRanking] = useState(null)
  useEffect(() => {
    if (selectedCareerRanking && !careerRankingDialogRef.current?.open) {
      careerRankingDialogRef.current?.showModal()
    }
  }, [selectedCareerRanking])
  const asOfDate = test ? '2024-12-31' : cacheDay
  const analysisSeason = useAnalysisSeason(calendarYear, test ? 12 : currentMonth, cacheDay)
  const { year: thisYear, month: thisMonth, quarter, yearRoundData, availableWeeks } = analysisSeason
  const roundLoadError = analysisSeason.status === 'error'
  const [careerRoundRequest, setCareerRoundRequest] = useState(1)
  const [historicalRoundData, setHistoricalRoundData] = useState(null)
  const [careerRoundStatus, setCareerRoundStatus] = useState('idle')
  const scoringStreakResult = useScoringStreak(existingMembers, asOfDate, existingMembers, cacheDay)
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
    () => analyzeScoringRecords(recordsByYear, asOfDate, eligibleMembers),
    [recordsByYear, asOfDate, eligibleMembers],
  )
  const careerPointRate = useMemo(
    () => analyzeCareerPointRate(recordsByYear, asOfDate, eligibleMembers),
    [recordsByYear, asOfDate, eligibleMembers],
  )
  const dailyGoalRecord = { ...dailyMaximums.goals, status: scoringStreakResult.status }
  const dailyAssistRecord = { ...dailyMaximums.assists, status: scoringStreakResult.status }
  const dailyAttackPointRecord = { ...dailyMaximums.attackPoints, status: scoringStreakResult.status }
  const bestFive = useBestFive(thisYear, thisMonth, cacheDay, analysisSeason.records, {
    yearRoundData, roundStatus: analysisSeason.status, weeklyTeams: totalWeeklyTeamData,
    members: totalMembers, oneCharacterMembers, nicknames: membersNickName, asOfDate, eligibleMembers,
  })
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
  const recentForm = useRecentForm(existingMembers, asOfDate, cacheDay, {
    year: thisYear, quarter, memberInfo: bestFive.memberInfo,
    cleanSheetDays: careerCleanSheets?.days, cleanSheetStatus: careerCleanSheetStatus,
  })
  const playerComparison = useMemo(() => analyzePlayerRadar(
    bestFive.records, existingMembers, thisMonth,
  ), [bestFive.records, existingMembers, thisMonth])
  const thisQuarterData = useMemo(() => getQuarterRoundGoals(yearRoundData, thisMonth), [yearRoundData, thisMonth])
  const [processedQuarterSource, setProcessedQuarterSource] = useState(null)
  const [processedWeeklyTeamSource, setProcessedWeeklyTeamSource] = useState(null)
  const [processedPartnerData, setProcessedPartnerData] = useState(null)
  const [mvpStatus, setMvpStatus] = useState('loading')
  const activePlayers = useMemo(() => [...existingMembers].sort((a, b) => a.localeCompare(b, 'ko')), [existingMembers])
  const newPlayers = useMemo(() => new Set(activePlayers.filter((player) => {
    const startDate = bestFive.memberInfo?.[player]?.startDate
    if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate > cacheDay) return false
    const date = new Date(`${startDate}T00:00:00Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) return false
    const [year, month] = startDate.split('-').map(Number)
    const monthsAgo = (Number(cacheDay.slice(0, 4)) - year) * 12 + currentMonth - month
    return monthsAgo >= 0 && monthsAgo <= 3
  })), [activePlayers, bestFive.memberInfo, cacheDay, currentMonth])
  const returningPlayers = useMemo(() => {
    const today = new Date(`${cacheDay}T00:00:00Z`)
    const cutoff = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1))
    const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate()
    cutoff.setUTCDate(Math.min(today.getUTCDate(), lastDay))
    const earliestDate = cutoff.toISOString().slice(0, 10)
    return new Set(activePlayers.filter((player) => {
      const restartDate = bestFive.memberInfo?.[player]?.restartDate
      if (typeof restartDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(restartDate) ||
        restartDate < earliestDate || restartDate > cacheDay) return false
      const date = new Date(`${restartDate}T00:00:00Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === restartDate
    }))
  }, [activePlayers, bestFive.memberInfo, cacheDay])
  const [sonKaeDuo, setSonKaeDuo] = useState({})
  const [mostMvpPlayer, setMostMvpPlayer] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [mostPartnerPlayers, setMostPartnerPlayers] = useState({})
  const [mostMercenaryPlayer, setMostMercenaryPlayer] = useState({})
  const [tenTenClub, setTenTenClub] = useState({})
  const [twentyTwentyClub, setTwentyTwentyClub] = useState({})
  const [greedyPlayer, setGreedyPlayer] = useState({})
  const [altruisticPlayer, setAltruisticPlayer] = useState({})
  const [analysisView, setAnalysisView] = useState('overview')
  const [analysisTransition, setAnalysisTransition] = useState('idle')
  const analysisStageRef = useRef(null)
  const analysisToolbarRef = useRef(null)
  const pendingAnalysisView = useRef('overview')
  const lastAnalysisSection = useRef(null)
  const analysisNavigationStarted = useRef(false)
  const restoreAnalysisFocus = useRef(false)
  const allSectionsExpanded = analysisView === 'all'
  const showIndividual = allSectionsExpanded || analysisView === 'individual'
  const showSeason = allSectionsExpanded || analysisView === 'season'
  const showCareer = allSectionsExpanded || analysisView === 'career'
  const isSectionVisible = (section) => analysisView === 'overview' || allSectionsExpanded || analysisView === section
  const changeAnalysisView = (view, restoreFocus = false) => {
    analysisNavigationStarted.current = true
    restoreAnalysisFocus.current = restoreFocus
    pendingAnalysisView.current = view
    if (view === analysisView && analysisTransition === 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnalysisView(view)
      setAnalysisTransition('idle')
    } else {
      setAnalysisTransition('leaving')
    }
  }
  const selectAnalysisSection = (section) => {
    lastAnalysisSection.current = section
    changeAnalysisView(analysisView === section ? 'overview' : section, analysisView === section)
  }
  const advanceAnalysisTransition = useCallback(() => {
    if (analysisTransition === 'leaving') {
      setAnalysisView(pendingAnalysisView.current)
      setAnalysisTransition('entering')
    } else if (analysisTransition === 'entering') {
      setAnalysisTransition('idle')
    }
  }, [analysisTransition])
  const handleAnalysisAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) return
    if ((event.animationName === 'analysis-section-leave' && analysisTransition === 'leaving') ||
      (event.animationName === 'analysis-section-enter' && analysisTransition === 'entering')) {
      advanceAnalysisTransition()
    }
  }
  useEffect(() => {
    if (analysisTransition === 'idle') return undefined
    // Finish even if an animation is interrupted; cleanup also cancels stale transitions.
    const timer = window.setTimeout(advanceAnalysisTransition, analysisTransition === 'leaving' ? 180 : 240)
    return () => window.clearTimeout(timer)
  }, [analysisTransition, advanceAnalysisTransition])
  useEffect(() => {
    if (!analysisNavigationStarted.current) return
    analysisToolbarRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    if (analysisView === 'overview' && restoreAnalysisFocus.current) {
      restoreAnalysisFocus.current = false
      analysisStageRef.current?.querySelector(`#analysis-${lastAnalysisSection.current || 'individual'}-title button`)
        ?.focus({ preventScroll: true })
    }
  }, [analysisView])
  const starterPointRates = useMemo(() => analyzeStarterPointRate(
    yearRoundData,
    totalWeeklyTeamData,
    totalMembers,
    thisYear,
    thisMonth,
    eligibleMembers,
  ), [yearRoundData, totalWeeklyTeamData, totalMembers, thisYear, thisMonth, eligibleMembers])
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
    totalMembers,
    thisYear,
    thisMonth,
    eligibleMembers,
  ), [yearRoundData, totalWeeklyTeamData, totalMembers, thisYear, thisMonth, eligibleMembers])
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
    eligibleMembers,
  ), [thisQuarterData, totalWeeklyTeamData, totalMembers, thisYear, thisMonth, bestFive.memberInfo, eligibleMembers])
  const lowScoringDuo = lowScoringDuoStats ? {
    name: lowScoringDuoStats.pairs.map(({ players }) => players.join(' - ')),
    count: `같은 팀 ${lowScoringDuoStats.pairs[0].sharedDays}회 · 합작 ${lowScoringDuoStats.pairs[0].goals}골`,
    duos: lowScoringDuoStats.pairs.map(({ players, sharedDays, goals }) => ({
      id: JSON.stringify(players), players, count: goals, sharedDays,
    })),
  } : {}

  const seasonCleanSheets = bestFive.cleanSheets
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
      icon: 'seasonMvp',
      title: '최다 MVP',
      description: '데일리 MVP 최다 플레이어',
      data: mostMvpPlayer,
    },
    {
      type: 'clean-sheet', icon: 'goldenGlove', title: '골든 글러브', description: '최다 클린시트',
      data: { ...rankCareerCounts(seasonCleanSheetCounts, '회', true, Infinity, eligibleMembers), status: seasonCleanSheetStatus },
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
      icon: 'seasonRising',
      title: '최근 상승세',
      // description: '최근 출석 2회와 직전 2회의 공격포인트·승점 합계 비교',
      data: recentForm,
    },
    // {
    //   type: 'recent-fall',
    //   // isNew: true,
    //   icon: 'falling',
    //   title: '최근 하락세',
    //   // description: '최근 출석 2회와 직전 2회의 공격포인트·승점 합계 비교',
    //   data: recentForm,
    // },
    {
      // isNew: true,
      icon: 'trio',
      title: '세 얼간이',
      description: '승률이 제일 높은 트리오',
      data: winningTrio,
    },
    {
      type: 'duo',
      icon: 'seasonDuo',
      title: '손케 듀오',
      description: '합작 골이 가장 많은 듀오',
      data: sonKaeDuo,
    },
    {
      type: 'starter',
      icon: 'early',
      layoutGroup: 'season-starters',
      title: '얼리 스타터',
      description: '9시 이전 승점생산률 Top',
      data: bestEarlyStarter,
    },
    {
      type: 'starter',
      icon: 'late',
      layoutGroup: 'season-starters',
      title: '슬로우 스타터',
      description: '9시 이후 승점생산률 Top',
      data: bestSlowStarter,
    },
    {
      type: 'scoring-streak',
      // isNew: true,
      icon: 'streak',
      title: '꾸준한 피니셔',
      description: '출석할 때마다 골을 기록한 연속 횟수 Top',
      data: scoringStreak,
    },
    {
      type: 'assist-streak',
      icon: 'playmaker',
      title: '꾸준한 플레이메이커',
      description: '출석할 때마다 어시를 기록한 연속 횟수 Top',
      data: assistStreak,
    },
    // {
    //   type: 'partners',
    //   icon: 'partners',
    //   title: '와이리 많이 봅니까 우리',
    //   description: '최다 같은 팀 듀오',
    //   data: mostPartnerPlayers,
    // },
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
      title: '골',
      // description: '통산 한 날짜 최다 득점 기록',
      data: dailyGoalRecord,
    },
    {
      type: 'daily-record',
      icon: 'dailyAssist',
      title: '어시',
      // description: '통산 한 날짜 최다 도움 기록',
      data: dailyAssistRecord,
    },
  ]

  const careerTypes = ['daily-record', 'scoring-streak', 'assist-streak', 'longest-absent']
  const seasonAnalysisItems = analysisItems.filter(({ type }) => !careerTypes.includes(type))
  const seasonAnalysisRows = groupAnalysisRows(seasonAnalysisItems)

  // 개인별 데이터
  const [thisQuarterMVP, setThisQuarterMVP] = useState([])
  const [allTimeMVP, setAllTimeMVP] = useState([])
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
    if (!eligibleMembers.has(selectedPlayerName)) return null
    const detailMap = integratedData?.get(selectedPlayerName) || {
      ...thisQuarterMostPartners?.[selectedPlayerName],
      ...mercenaryBring?.get(selectedPlayerName),
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
      const players = key.split('_').map(getFullName)
      if (players.every(Boolean) && players.includes(selectedPlayerName)) {
        for (const partner of players) {
          if (partner !== selectedPlayerName) combi.push([partner, value])
        }
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
    starterPointRates, thisQuarterMVP, thisQuarterPlayersCombination, eligibleMembers, getFullName])
  const playerName = playerDetail?.name
  const selectedMemberInfo = bestFive.memberInfo?.[playerName]
  const isGoalkeeper = selectedMemberInfo?.goalKeeper === true || selectedMemberInfo?.goalkeeper === true
  const [careerAwardHistory, setCareerAwardHistory] = useState({ status: 'idle', records: [] })
  const historyLoadedDay = useRef(null)
  const needsAwardHistory = Boolean(playerName) || showCareer
  const careerAwards = useMemo(() =>
    careerAwardHistory.status === 'ready' && playerName
      ? analyzeCareerAwards(careerAwardHistory.records, playerName, asOfDate)
      : [],
  [careerAwardHistory, playerName, asOfDate])
  const careerAwardLeaders = useMemo(() =>
    analyzeCareerAwardLeaders(careerAwardHistory.records, asOfDate, eligibleMembers),
  [careerAwardHistory.records, asOfDate, eligibleMembers])
  const titleCollections = useMemo(() =>
    analyzeTitleCollections(careerAwardHistory.records, asOfDate, eligibleMembers),
  [careerAwardHistory.records, asOfDate, eligibleMembers])
  const quarterPlayerStats = playerName ? playerComparison.players.get(playerName) : null
  const hasQuarterRecord = Boolean(quarterPlayerStats)
  const playerStartDate = selectedMemberInfo?.startDate
  const careerRecord = useMemo(() =>
    playerName && scoringStreakResult.status === 'ready'
      ? analyzeCareerRecords(recordsByYear, playerName, asOfDate, playerStartDate)
      : null,
  [recordsByYear, playerName, scoringStreakResult.status, asOfDate, playerStartDate])
  const careerStyle = careerRecord
    ? getCareerAttackStyle(careerRecord.totals.goals, careerRecord.totals.assists)
    : null
  const strongestSeasons = useMemo(() =>
    playerName && scoringStreakResult.status === 'ready'
      ? analyzePlayerSeasons(recordsByYear, playerName, asOfDate, playerStartDate)
      : [],
  [recordsByYear, playerName, scoringStreakResult.status, asOfDate, playerStartDate])
  const chartQuarters = useMemo(() => {
    const quarters = careerRecord?.quarters || []
    return isGoalkeeper ? quarters.map((record) => ({
      ...record, cleanSheets: careerCleanSheets?.seasons.get(record.key)?.get(playerName) ?? null,
    })) : quarters
  }, [careerRecord, isGoalkeeper, careerCleanSheets, playerName])
  const careerStarterStyles = useMemo(() =>
    careerRoundStatus === 'ready' && careerRoundRoots && !roundLoadError
      ? analyzeCareerStarterStyles(careerRoundRoots, totalWeeklyTeamData, totalMembers, asOfDate, eligibleMembers)
      : new Map(),
  [careerRoundStatus, careerRoundRoots, roundLoadError, totalWeeklyTeamData, totalMembers, asOfDate, eligibleMembers])
  const careerStyles = [careerStarterStyles.get(playerName), careerStyle].filter(Boolean)
  const careerPartners = useMemo(() =>
    playerName && Array.isArray(totalWeeklyTeamData)
      ? analyzeCareerPartners(totalWeeklyTeamData, careerRoundRoots || {}, playerName, totalMembers, asOfDate, oneCharacterMembers, eligibleMembers)
      : null,
  [totalWeeklyTeamData, careerRoundRoots, playerName, totalMembers, asOfDate, oneCharacterMembers, eligibleMembers])
  const careerMVPCount = allTimeMVP.filter((name) => name === playerName).length
  const careerMostMVP = useMemo(() => {
    const counts = new Map()
    for (const name of allTimeMVP) {
      if (!eligibleMembers.has(name)) continue
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return { ...rankCareerCounts(counts, '회', true), status: mvpStatus }
  }, [allTimeMVP, mvpStatus, eligibleMembers])
  const careerDuo = useMemo(() => {
    const result = analyzeCareerGoalDuos(careerRoundRoots || {}, totalMembers, asOfDate, oneCharacterMembers, eligibleMembers)
    return {
      ...result,
      count: result.count > 0 ? formatCareerNumber(result.count, '골') : '',
      additionalCount: result.additionalCount > 0 ? formatCareerNumber(result.additionalCount, '골') : '',
      status: careerRoundStatus === 'error' || roundLoadError ? 'error'
        : careerRoundStatus === 'ready' && careerRoundRoots ? 'ready' : 'loading',
    }
  }, [careerRoundRoots, totalMembers, asOfDate, oneCharacterMembers, careerRoundStatus, roundLoadError, eligibleMembers])
  const careerRankings = useMemo(() => analyzeCareerRankings({
    recordsByYear, members: existingMembers, asOfDate,
    mvpNames: allTimeMVP, cleanSheetTotals: careerCleanSheets?.totals,
  }), [recordsByYear, existingMembers, asOfDate, allTimeMVP, careerCleanSheets])
  const selectedRankingKey = selectedCareerRanking?.key
  const selectedAwardRanking = careerAwardLeaders.find(({ key }) => selectedRankingKey === `award-${key}`)
  const selectedRankingEntries = selectedRankingKey === 'pointRate' ? careerPointRate.rankings
    : selectedRankingKey === 'duos' ? careerDuo.rankings
      : selectedAwardRanking ? selectedAwardRanking.rankings : careerRankings[selectedRankingKey] || []
  const selectedRankingStatus = selectedAwardRanking
    ? careerAwardHistory.status === 'idle' ? 'loading' : careerAwardHistory.status
    : selectedRankingKey === 'cleanSheets' ? careerCleanSheetStatus
      : selectedRankingKey === 'duos' ? careerDuo.status
        : selectedRankingKey === 'mvp' ? mvpStatus : scoringStreakResult.status
  const careerSeasonSpecialists = useMemo(() =>
    analyzeSeasonSpecialists(recordsByYear, existingMembers, asOfDate),
  [recordsByYear, existingMembers, asOfDate])
  const careerCumulativeItems = [
    {
      layoutGroup: 'career-attack',
      type: 'career-total',
      icon: 'careerGoalTop',
      title: '골',
      // description: '통산 최다 골',
      data: { ...dailyMaximums.totalGoals, status: scoringStreakResult.status },
    },
    {
      layoutGroup: 'career-attack',
      type: 'career-total',
      icon: 'careerAssistTop',
      title: '어시',
      // description: '통산 최다 어시',
      data: { ...dailyMaximums.totalAssists, status: scoringStreakResult.status },
    },
    {
      layoutGroup: 'career-attack',
      type: 'career-total',
      icon: 'careerAttackPointsTop',
      title: '공격포인트',
      data: { ...dailyMaximums.totalAttackPoints, status: scoringStreakResult.status },
    },
    {
      layoutGroup: 'career-participation',
      type: 'career-clean-sheet',
      icon: 'goldenGlove',
      title: '클린시트',
      data: {
        ...rankCareerCounts(careerCleanSheets?.totals || new Map(), '회', true, Infinity, eligibleMembers),
        status: careerCleanSheetStatus,
      },
    },
    {
      layoutGroup: 'career-participation',
      type: 'career-total',
      icon: 'careerAttendanceTop',
      title: '출석',
      data: { ...dailyMaximums.totalAttendance, status: scoringStreakResult.status },
    },
    {
      layoutGroup: 'career-participation',
      type: 'career-mvp',
      icon: 'careerMvpTop',
      title: 'MVP',
      // description: '통산 데일리 MVP 최다 플레이어',
      data: careerMostMVP,
    },
    {
      layoutGroup: 'career-points',
      type: 'career-total',
      icon: 'careerPointsTop',
      title: '승점',
      data: { ...dailyMaximums.totalPoints, status: scoringStreakResult.status },
    },
    {
      layoutGroup: 'career-points',
      type: 'career-point-rate',
      icon: 'careerPointRateTop',
      title: '승점생산률',
      description: '70% 이상 출석한 플레이어 중',
      data: {
        ...careerPointRate,
        count: careerPointRate.pointRate === null ? '' : `${careerPointRate.pointRate.toFixed(2)}점`,
        additionalCount: careerPointRate.additionalPointRate === null ? '' : `${careerPointRate.additionalPointRate.toFixed(2)}점`,
        status: scoringStreakResult.status,
      },
    },
  ]
  const careerDailyItems = [
    ...analysisItems.filter(({ type }) => type === 'daily-record')
      .map((item) => ({ ...item, layoutGroup: 'career-daily' })),
    {
      layoutGroup: 'career-daily-impact',
      type: 'daily-record',
      icon: 'dailyAttackPoints',
      title: '공격포인트',
      data: dailyAttackPointRecord,
    },
    {
      layoutGroup: 'career-daily-impact',
      type: 'career-clean-sheet',
      icon: 'dailyCleanSheet',
      title: '클린시트',
      data: {
        ...rankCareerCounts(careerCleanSheets?.dailyHigh || new Map(), '회', false, Infinity, eligibleMembers),
        status: careerCleanSheetStatus,
      },
    },
  ]
  const careerOtherItems = [
    {
      type: 'career-duo',
      icon: 'duo',
      title: '손케 듀오',
      description: '통산 합작 골이 가장 많은 듀오',
      data: careerDuo,
    },
    ...careerTypes
      .filter((type) => type !== 'daily-record' && type !== 'longest-absent')
      .flatMap((careerType) => analysisItems.filter(({ type }) => type === careerType)),
    {
      type: 'career-season-aces',
      icon: 'seasonAces',
      title: '계절 에이스',
      data: { seasons: careerSeasonSpecialists, status: scoringStreakResult.status },
    },
    {
      type: 'career-award-leaders',
      icon: 'careerAwardLeaders',
      title: '부문별 최다',
      data: {
        awards: careerAwardLeaders,
        status: careerAwardHistory.status === 'idle' ? 'loading' : careerAwardHistory.status,
      },
    },
    {
      type: 'career-title-collection',
      icon: 'titleCollection',
      title: '타이틀 수집',
      // description: '통산 서로 다른 부문의 타이틀을 획득한 플레이어',
      data: {
        awards: titleCollections,
        status: careerAwardHistory.status === 'idle' ? 'loading' : careerAwardHistory.status,
      },
    },
    ...analysisItems.filter(({ type }) => type === 'longest-absent'),
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
        formatMostConceded(careerCleanSheets?.concededTotals.get(playerName), eligibleMembers))],
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
    if (selectedPlayerName && !eligibleMembers.has(selectedPlayerName)) {
      playerDetailDialogRef.current?.close()
      setSelectedPlayerName(null)
    }
  }, [selectedPlayerName, eligibleMembers])

  useEffect(() => {
    if (!needsAwardHistory || historyLoadedDay.current === cacheDay) return undefined
    historyLoadedDay.current = cacheDay
    setCareerAwardHistory({ status: 'idle', records: [] })
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
  }, [needsAwardHistory, cacheDay])

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

  const getPointClub = useCallback((pointData) => {
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
  }, [getFullName])

  const getGreedyPlayer = useCallback((pointData) => {
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
  }, [getFullName])

  const getAltruisticPlayer = useCallback((pointData) => {
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
  }, [getFullName])

  useEffect(() => {
    // 이번 시즌 기록은 한 주 이상의 경기 데이터가 있을 때 계산한다.
    if (availableWeeks >= 1) {
      const totalData = []
      thisQuarterData.forEach((data) => {
        Object.values(data[1]).forEach((value) => {
          totalData.push(value)
        })
      })
      const { combinations, leaders, chasing } = analyzeSeasonGoalDuos(totalData, resolveRecordMember, eligibleMembers)
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

      // Count each eligible scorer/assister independently, including goals with a retired partner.
      const playerRecords = totalData.map((item) => ({
        ...item, goal: getFullName(item?.goal), assist: getFullName(item?.assist),
      }))
      const { dataByTime } = analyzeStarterStats(playerRecords)
      const pointData = {}
      const pointDataMap = new Map()
      for (const item of playerRecords) {
        for (const field of ['goal', 'assist']) {
          const name = item[field]
          if (!name) continue
          pointData[name] ??= { goal: 0, assist: 0 }
          pointData[name][field]++
        }
      }
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
  }, [thisQuarterData, existingMembers, availableWeeks, resolveRecordMember, eligibleMembers, getFullName,
    getPointClub, getGreedyPlayer, getAltruisticPlayer])

  const applyDailyMVPData = useCallback((fetchedData) => {
    const lastDateId = asOfDate.slice(2).replaceAll('-', '')
    const datedPlayers = fetchedData.filter(({ id }) => /^\d{6}$/.test(id) && id <= lastDateId)
      .map(({ id, data }) => ({
        id,
        players: (Array.isArray(data.bestPlayers)
          ? data.bestPlayers.map((player) => player?.name) : [data.name])
          .map(getFullName).filter(Boolean),
      }))
    setAllTimeMVP(datedPlayers.flatMap(({ players }) => players))
    const filteredData = datedPlayers.filter(({ id }) =>
      id.slice(0, 2) === thisYear.slice(2, 4) &&
      Math.ceil(Number(id.slice(2, 4)) / 3) === Math.ceil(thisMonth / 3),
    ).flatMap(({ players }) => players)
    setThisQuarterMVP(filteredData)
    const counts = new Map()
    for (const name of filteredData) counts.set(name, (counts.get(name) || 0) + 1)
    setMostMvpPlayer(rankCareerCounts(counts, '회'))
    setMvpStatus('ready')
  }, [asOfDate, thisMonth, thisYear, getFullName])

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
          const bring = getFullName(player.slice(0, 2))
          if (bring) {
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
        const member = getFullName(player)
        if (member) {
          playerData[member] ??= {}
          const partners = new Set(row.map(getFullName).filter((name) => name && name !== member))
          for (const partner of partners) {
            playerData[member][partner] = (playerData[member][partner] || 0) + 1
          }
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
      const fullName = temp[0]
      setMostMercenaryPlayer({
        name: [fullName],
        count: maxMercenaryCount + '회',
      })
    } else {
      setMostMercenaryPlayer({})
    }
    setProcessedWeeklyTeamSource({ data: totalWeeklyTeamData, members: existingMembers, year: thisYear, month: thisMonth })
  }, [totalWeeklyTeamData, thisYear, thisMonth, existingMembers, getFullName])

  useEffect(() => {
    if (Array.isArray(totalWeeklyTeamData) && existingMembers.length > 0) {
      getWeeklyTeamData()
    }
  }, [totalWeeklyTeamData, existingMembers, getWeeklyTeamData])

  const getMostPartner = useCallback((data) => {
    const mostPartners = {}
    Object.entries(data).forEach(([key, rawPartners]) => {
      if (!eligibleMembers.has(key)) return
      const value = Object.fromEntries(Object.entries(rawPartners).filter(([name]) => eligibleMembers.has(name)))
      let count = 0
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
  }, [eligibleMembers, getFullName])

  useEffect(() => {
    if (weeklyTeamData) {
      getMostPartner(weeklyTeamData)
    }
  }, [weeklyTeamData, getMostPartner])

  const playerDetailHandler = (name) => {
    if (!eligibleMembers.has(name)) return
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

  const renderAnalysisItem = ({ type, isNew, icon, title, titleNote, description, data, compact = false, career = false, clickHint = false }) => {
    const rankingKey = career ? careerRankingKeys[icon] : null
    const openRanking = () => {
      recordCareerCardClick()
      setSelectedCareerRanking({ key: rankingKey, title })
    }
    const inlineRecords = compact && type !== 'career-award' && (type === 'daily-record' || type?.startsWith('career-'))
    const descriptionBelowTitle = !compact || type === 'starter' || type === 'career-point-rate'
    const groupedItems = type === 'career-season-aces' ? data.seasons : data.awards
    const players = data.name?.filter(Boolean) ?? []
    const almostPlayers = data.additional?.filter(Boolean) ?? []
    const isChasingDuo = type === 'duo' || type === 'partners' || type === 'career-duo'
    const separateTiedPlayers = players.length > 1 && !isChasingDuo && type !== 'low-scoring-duo' && icon !== 'trio'
    const isAttendanceStreak = type === 'scoring-streak' || type === 'assist-streak'
    const isCleanSheet = type === 'clean-sheet' || type === 'career-clean-sheet'
    const hasChaserCount = isChasingDuo || isAttendanceStreak || isCleanSheet || type === 'career-total' || type === 'career-mvp' || type === 'career-point-rate' || type === 'career-award'
    const trendPlayers = type === 'recent-fall' ? recentForm.decliners : recentForm.leaders

    return (
      <div
        key={title}
        className={rankingKey
          ? `analysis-career-card relative min-w-0 cursor-pointer rounded-lg border border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-400 dark:focus-visible:outline-blue-300 ${compact ? 'px-0.5 py-4' : 'px-4 py-5'}`
          : `${compact ? 'min-w-0 px-1 py-4' : 'py-5 first:pt-0'} ${career ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}
        role={rankingKey ? 'button' : undefined}
        tabIndex={rankingKey ? 0 : undefined}
        aria-label={rankingKey ? `${title} 통산 TOP 10 보기` : undefined}
        aria-haspopup={rankingKey ? 'dialog' : undefined}
        aria-controls={rankingKey ? 'career-ranking-dialog' : undefined}
        onClick={rankingKey ? openRanking : undefined}
        onKeyDown={rankingKey ? (event) => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            openRanking()
          }
        } : undefined}
      >
        <dt className={compact ? 'flex flex-col items-center justify-center gap-1 font-bold' : 'flex flex-wrap items-center justify-center gap-2 font-bold'}>
          {rankingKey && clickHint && showCareerClickHint && (
            <span aria-hidden="true" className="analysis-card-click-hint">
              <span className="analysis-card-click-glow">
                <i className="analysis-card-click-ring" />
                <i className="analysis-card-click-ring" />
                <i className="analysis-card-click-ring" />
              </span>
              <span className="analysis-card-click-label font-sans font-bold italic">클릭!</span>
            </span>
          )}
          <AnalysisIcon name={icon} />
          <span className={compact ? 'relative flex min-h-10 w-full items-center justify-center break-keep leading-5 font-dnf-forged [overflow-wrap:anywhere]' : 'relative inline-block font-dnf-forged text-[20px]'}>
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
              자세히
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
              자세히
            </button>
          )}
          {type === 'career-season-aces' && (
            <button
              type="button"
              className={detailsButtonClass}
              aria-label={`${title} 선정 기준 자세히 보기`}
              aria-haspopup="dialog"
              aria-controls="season-specialist-method-dialog"
              onClick={() => seasonSpecialistDialogRef.current?.showModal()}
            >
              자세히
            </button>
          )}
        </dt>
        {description && descriptionBelowTitle && (
          <dd className={`${type !== 'starter' && 'mt-1'} text-gray-500 dark:text-gray-400 ${compact ? 'break-keep text-[11px] leading-relaxed' : 'text-[12px]'}`}>{description}</dd>
        )}
        {type === 'best-five' ? (
          <dd className="mt-4" aria-live="polite">
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
          <dd className={`mt-2 break-words text-gray-500 dark:text-gray-400 ${compact ? 'text-xs leading-relaxed' : 'text-sm'}`} aria-live="polite">
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
            <dd className="mt-2" aria-live="polite">
              {recentForm.status === 'ready' && trendPlayers.length > 0 ? (
                <ul className="mx-auto w-fit max-w-full space-y-1 text-left">
                  {trendPlayers.map((player) => (
                    <li key={player.name} className="grid grid-cols-[4em_minmax(0,1fr)] items-baseline gap-x-2">
                      <span className="min-w-0 break-words font-semibold text-zinc-700 dark:text-zinc-200 font-dnf-forged">{player.name}</span>
                      <span className="min-w-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                        {player.metric === 'cleanSheets' ? '클린시트' : '공포'} {trendChangeFormatter.format(player.increase)} · 승점 {trendChangeFormatter.format(player.winPointIncrease)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {recentForm.status === 'loading'
                    ? '비교 기록을 불러오는 중입니다.'
                    : recentForm.status === 'error'
                      ? '비교 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'
                      : recentForm.eligibleCount === 0
                        ? '-'
                        : `최근 기록과 승점 합계의 ${type === 'recent-fall' ? '하락' : '상승'} 조건에 맞는 플레이어가 없습니다.`}
                </p>
              )}
            </dd>
          </>
        ) : type === 'career-award-leaders' ? (
          <dd className="mt-4" aria-live="polite">
            <dl className="grid grid-cols-4 gap-2">
              {data.awards.map((group) => renderAnalysisItem({
                type: 'career-award',
                icon: group.key,
                title: group.label,
                compact: true,
                career: true,
                data: {
                  status: data.status,
                  name: group.winners.map(({ name }) => name),
                  count: group.winners.length > 0 ? `${group.winners[0].count}회` : '',
                  additional: group.chasers.map(({ name }) => name),
                  additionalCount: group.chasers.length > 0 ? `${group.chasers[0].count}회` : '',
                },
              }))}
            </dl>
          </dd>
        ) : type === 'career-season-aces' || type === 'career-title-collection' ? (
          <dd className="mt-4" aria-live="polite">
            <div className={`grid gap-2 ${type === 'career-title-collection' ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {groupedItems.map((group) => (
                <section key={group.key} className="min-w-0 text-center" aria-labelledby={`${type}-${group.key}`}>
                  <h3 id={`${type}-${group.key}`} className={`mb-3 flex items-center justify-center gap-1 text-sm font-semibold font-dnf-forged ${type === 'career-title-collection' ? 'flex-col' : ''}`}>
                    <AnalysisIcon name={group.key} />
                    <span>{group.label}</span>
                  </h3>
                  {group.winners.length > 0 ? (
                    <>
                      <ul className={type === 'career-title-collection' && group.key === 'double' ? 'grid grid-cols-2 gap-x-1 gap-y-2' : 'space-y-2'}>
                        {group.winners.map((player) => (
                          <li key={player.name} className={type === 'career-title-collection' ? 'flex min-w-0 flex-wrap items-center justify-center gap-1' : 'min-w-0'}>
                            <span className="block break-words text-sm font-semibold text-zinc-700 dark:text-zinc-200 font-dnf-forged">{player.name}</span>
                            {type === 'career-title-collection' && (
                              <span className="inline-flex shrink-0 items-center gap-0.5">
                                {player.titles.map((title) => (
                                  <img key={title} src={careerAwardIcons[title]} alt={title} title={title} className="h-3 w-3 object-contain sm:h-4 sm:w-4" />
                                ))}
                              </span>
                            )}
                            {type === 'career-season-aces' && (
                              <span className="mt-0.5 block text-xs tabular-nums text-gray-500 dark:text-gray-400">
                                {`${player.pointRate.toFixed(2)}점`}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 font-dnf-forged">-</span>
                  )}
                </section>
              ))}
            </div>
          </dd>
        ) : type === 'duo' || type === 'low-scoring-duo' ? (
          <>
            <dd className="mx-auto mt-2 w-[90%]">
              {data.duos?.length > 0 ? (
                <DuoRecordList duos={data.duos} />
              ) : (
                <span className="font-semibold text-zinc-700 dark:text-zinc-200 font-dnf-forged">-</span>
              )}
            </dd>
            {data.additionalDuos?.length > 0 && (
              <dd className="mx-auto mt-3 w-[90%]">
                <p className="mb-2 text-xs font-medium text-goal dark:text-rose-400">추격 듀오</p>
                <DuoRecordList duos={data.additionalDuos} muted />
              </dd>
            )}
          </>
        ) : (
          <>
            <dd className={compact ? 'mt-2 flex min-w-0 flex-col items-center gap-1' : 'mx-auto mt-2 flex w-[90%] flex-wrap items-baseline justify-center gap-x-2 gap-y-1'}>
              {inlineRecords ? (
                players.length > 0 ? <InlinePlayerRecords names={players} count={data.count} />
                  : <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">기록 없음</span>
              ) : (
              <>
              <span className={`min-w-0 break-words font-semibold text-zinc-700 dark:text-zinc-200 font-dnf-forged ${compact ? 'w-full text-sm' : ''} ${separateTiedPlayers ? compact ? 'flex flex-col items-center gap-2' : 'inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-3 gap-y-2' : ''}`}>
                {players.length > 0
                  ? separateTiedPlayers
                    ? players.map((name) => <span key={name} className="inline-block max-w-full break-keep">{name}</span>)
                    : compact
                      ? players.map((name) => <span key={name} className="block break-keep">{name}</span>)
                      : players.join(
                      type === 'duo' || type === 'partners' || type === 'low-scoring-duo' || type === 'starter' || type === 'daily-record'
                        ? ' '
                        : ' ',
                    )
                  : type === 'daily-record' || type?.startsWith('career-')
                    ? '기록 없음'
                    : '-'}
              </span>
              {players.length > 0 && data.count && (
                <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                  {!compact && <span>·</span>}
                  <span className="text-sm tabular-nums">{data.count}</span>
                </span>
              )}
              </>
              )}
            </dd>
            {almostPlayers.length > 0 && (
              <dd className={`mt-2 flex flex-wrap justify-center gap-1 text-gray-500 dark:text-gray-400 animate-bounceUpDown ${compact ? 'text-xs' : 'text-sm'}`}>
                <p className="font-medium text-goal dark:text-rose-400">
                  {isChasingDuo ? '추격 듀오' : hasChaserCount ? '추격자' : '달성 임박'}
                </p>
                <div className={compact ? 'flex min-w-0 w-full flex-col items-center gap-1' : 'flex flex-wrap justify-center gap-1'}>
                  {inlineRecords ? (
                    <InlinePlayerRecords names={almostPlayers} count={hasChaserCount ? data.additionalCount : undefined} muted />
                  ) : (
                  <>
                  <span className="min-w-0 break-words">
                    {compact
                      ? almostPlayers.map((name) => <span key={name} className="block">{name}</span>)
                      : almostPlayers.join(!type ? ' ' : ' / ')}
                  </span>
                  {!compact && hasChaserCount && data.additionalCount && <span>·</span>}
                  <span>
                    {hasChaserCount && data.additionalCount && `${data.additionalCount}`}
                  </span>
                  </>
                  )}
                </div>
              </dd>
            )}
            {isAttendanceStreak && data.allTimeRecord?.count > data.currentCount && (
              <dd className="mt-2 text-xs text-gray-400 dark:text-gray-400">
                <p className="font-medium text-green-800 dark:text-green-500">통산 최장기록</p>
                <div className="flex flex-wrap justify-center gap-1">
                  <span>{data?.allTimeRecord?.name?.join(', ')}</span>
                  <span>·</span>
                  <span>{data?.allTimeRecord?.count}일 연속</span>
                </div>
              </dd>
            )}
          </>
        )}
        {description && !descriptionBelowTitle && <dd className="mt-2 break-keep text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{description}</dd>}
      </div>
    )
  }

  const renderAnalysisRows = (rows, career = false) => (
    <div className={career ? 'space-y-2' : 'divide-y divide-gray-200 dark:divide-gray-700'}>
      {rows.map((row, rowIndex) => (
        <dl key={row.key} className={career
          ? `grid gap-2 ${row.items.length === 1 ? 'grid-cols-1' : row.items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`
          : row.items.length > 1 ? `grid gap-x-2 ${row.items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}` : 'py-5 first:pt-0 [&>div]:py-0'}>
          {row.items.map((item, itemIndex) => renderAnalysisItem({ ...item, compact: row.items.length > 1, career, clickHint: career && rowIndex === 0 && itemIndex === 0 }))}
        </dl>
      ))}
    </div>
  )

  return (
    <div
      className="analysis-tab mx-auto flex w-full min-w-0 max-w-3xl flex-col px-2 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-center"
      data-keyboard-navigation={keyboardNavigation}
    >
      <>
        <div ref={analysisToolbarRef} className="flex min-h-10 items-center justify-end gap-3 py-2">
          {analysisView !== 'overview' && (
            <button
              type="button"
              className={`${detailsButtonClass} mr-auto inline-flex items-center gap-1 !text-sm`}
              onClick={() => changeAnalysisView('overview', true)}
            >
              <ChevronRightIcon aria-hidden="true" className="h-4 w-4 rotate-180" />
              목록으로
            </button>
          )}
          <button
            type="button"
            className={`${detailsButtonClass} !text-sm`}
            aria-controls="individual-analysis season-analysis career-analysis"
            aria-expanded={allSectionsExpanded}
            onClick={() => changeAnalysisView(allSectionsExpanded ? 'overview' : 'all')}
          >
            {allSectionsExpanded ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>
        <div
          ref={analysisStageRef}
          className="analysis-section-stage"
          data-phase={analysisTransition}
          aria-busy={analysisTransition !== 'idle'}
          onAnimationEnd={handleAnalysisAnimationEnd}
        >
          <section className={showIndividual ? 'pb-4' : ''} hidden={!isSectionVisible('individual')} aria-labelledby="analysis-individual-title">
            <AnalysisSectionHeading
              id="analysis-individual-title"
              controls="individual-analysis"
              title="개인별 기록"
              expanded={showIndividual}
              focused={analysisView === 'individual'}
              onToggle={() => selectAnalysisSection('individual')}
            />
            <div id="individual-analysis" hidden={!showIndividual}>
              <div className="mt-3 grid grid-cols-4 items-center gap-x-1 gap-y-2">
                {activePlayers.length > 0 ? (
                  activePlayers.map((player) => (
                    <button
                      type="button"
                      key={player}
                      className="min-w-0 bg-transparent px-0 py-1 text-zinc-700 dark:text-zinc-200 sm:px-2"
                      aria-label={player}
                      title={returningPlayers.has(player) ? '복귀 회원' : newPlayers.has(player) ? '신규 회원' : undefined}
                      aria-haspopup="dialog"
                      aria-controls="player-detail-dialog"
                      onClick={() => playerDetailHandler(player)}
                    >
                      <span className="relative inline-block max-w-full align-middle">
                        {returningPlayers.has(player) ? (
                          <ReturnBadge className="-left-1 -top-2" />
                        ) : (
                          newPlayers.has(player) && <NewBadge className="-left-1 -top-2" label="신규 회원" />
                        )}
                        <span className="block truncate">{player}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">등록된 플레이어가 없습니다.</p>
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
            className="m-auto max-h-[85vh] w-[min(92vw,36rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-center text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            {playerDetail && (
              <div className="flex max-h-[85vh] flex-col">
                <div className="relative flex shrink-0 items-center justify-center gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-500">
                  <div className="min-w-0 px-8">
                    <h3
                      id="player-detail-title"
                      className="flex flex-wrap items-center justify-center gap-2 break-words text-lg font-bold font-dnf-forged text-zinc-700 dark:text-zinc-200"
                    >
                      <span>{playerDetail.name}</span>
                      <GoalkeeperBadge memberInfo={selectedMemberInfo} imageSrc={goalkeeperGloves} />
                      {selectedMemberInfo?.injured === true && (
                        <span className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-0.5 font-sans text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
                          부상중
                        </span>
                      )}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
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
                  <form method="dialog" className="absolute right-3 top-3">
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
                          ? '비교 기록을 불러오지 못했습니다.'
                          : '비교 기록을 불러오는 중입니다.'}
                      </p>
                    )}
                    <hr className="my-5 border-gray-100 dark:border-gray-700" />
                    {bestFive.status === 'ready' && hasQuarterRecord && (
                      <dl className="space-y-2 text-sm">
                        {[
                          ...(isGoalkeeper
                            ? [
                                [
                                  '클린시트',
                                  formatCleanSheetRecord(
                                    seasonCleanSheetStatus,
                                    formatCareerNumber(seasonCleanSheetCounts.get(playerName) || 0, '회'),
                                  ),
                                ],
                                [
                                  '최다 실점 상대',
                                  formatCleanSheetRecord(
                                    seasonCleanSheetStatus,
                                    formatMostConceded(
                                      seasonCleanSheets?.concededSeasons.get(`${thisYear}-${quarter}`)?.get(playerName),
                                      eligibleMembers,
                                    ),
                                  ),
                                ],
                              ]
                            : []),
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
                            <div className={`grid items-center ${label === '스타일' ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                              {label !== '스타일' && <dt className="text-gray-500 dark:text-gray-400">{label}</dt>}
                              <dd className="min-w-0 break-words">
                                {label === '스타일' && playerDetail.style.length > 0 ? (
                                  <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                                    {playerDetail.style.map((style) => (
                                      <span key={style} className="whitespace-nowrap">
                                        #{style}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  value
                                )}
                              </dd>
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
                            className="sticky top-0 z-10 -mx-7 mb-4 flex flex-wrap items-center justify-center gap-2 border-b border-gray-100 bg-white px-7 py-2 font-semibold font-dnf-forged dark:border-gray-700 dark:bg-gray-900"
                          >
                            <span>통산 기록</span>
                          </h4>
                          <dl className="space-y-2 text-sm">
                            {careerTotalRows.map(([label, value]) => (
                              <Fragment key={label}>
                                <div className="grid grid-cols-2 items-center gap-4">
                                  <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                                  <dd className="min-w-0 break-words">{value}</dd>
                                </div>
                                <hr className="border-gray-100 dark:border-gray-700" />
                              </Fragment>
                            ))}
                            <div className="grid grid-cols-2 items-center gap-4">
                              <dt className="text-gray-500 dark:text-gray-400">최다 골 합작</dt>
                              <dd className="min-w-0 break-words" role={careerRoundStatus === 'loading' ? 'status' : undefined}>
                                {careerGoalPartner}
                              </dd>
                            </div>
                            <hr className="border-gray-100 dark:border-gray-700" />
                            {(careerAwardHistory.status !== 'ready' || careerAwards.length > 0) && (
                              <>
                                <div className="grid grid-cols-2 items-center gap-4">
                                  <dt className="text-gray-500 dark:text-gray-400">개인 수상</dt>
                                  <dd className="min-w-0 break-words" role={careerAwardHistory.status === 'idle' ? 'status' : undefined}>
                                    {careerAwardHistory.status === 'error' ? (
                                      '수상 기록을 불러오지 못했습니다.'
                                    ) : careerAwardHistory.status === 'idle' ? (
                                      '수상 기록을 불러오는 중입니다.'
                                    ) : (
                                      <ul className="flex flex-col items-center gap-1">
                                        {careerAwards.map((award) => {
                                          const [title, count] = award.split('x')
                                          return (
                                            <li key={award} className="relative flex items-center justify-center gap-1 whitespace-nowrap">
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
                            <div className="grid grid-cols-1 items-center gap-2">
                              <dd className="min-w-0 break-words">
                                {careerStyles.length > 0 || strongestSeasons.length > 0 ? (
                                  <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                                    {careerStyles.map((style) => (
                                      <span key={style} className="whitespace-nowrap">
                                        #{style}
                                      </span>
                                    ))}
                                    {strongestSeasons.length > 0 && (
                                      <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1">
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
                                            {/*<span>사나이</span>*/}
                                            <button
                                              type="button"
                                              className={`${detailsButtonClass} !ml-0 !text-[8px] shrink-0 whitespace-nowrap font-sans ${playerSeasonTextColors[season.key]}`}
                                              aria-label="개인 최고 계절 선정 기준 자세히 보기"
                                              aria-haspopup="dialog"
                                              aria-controls="player-season-method-dialog"
                                              onClick={() => playerSeasonDialogRef.current?.showModal()}
                                            >
                                              자세히
                                            </button>
                                          </span>
                                        ))}
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
                          <div className="sticky top-0 z-10 -mx-7 mb-4 flex flex-row items-center justify-center gap-2 border-b border-gray-100 bg-white px-7 py-2 dark:border-gray-700 dark:bg-gray-900">
                            <h4 id="career-high-title" className="font-semibold font-dnf-forged">
                              커리어 하이
                            </h4>
                            <span className="relative top-1 text-[11px] text-gray-500 dark:text-gray-400">항목별</span>
                          </div>
                          <dl className="space-y-2 text-sm">
                            {careerHighRows.map(([label, value]) => (
                              <Fragment key={label}>
                                <div className="grid grid-cols-2 items-center gap-4">
                                  <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
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
                      <div className="sticky top-0 z-10 -mx-7 mb-3 flex flex-wrap items-center justify-center gap-2 border-b border-gray-100 bg-white px-7 py-2 dark:border-gray-700 dark:bg-gray-900">
                        <h4 id="quarterly-record-title" className="shrink-0 font-semibold font-dnf-forged">
                          분기 추세
                        </h4>
                        <span className="relative top-1 text-[11px] text-gray-500 dark:text-gray-400">항목별 최고 분기 대비</span>
                      </div>
                      {(bestFive.memberInfo === null && bestFive.status === 'error') || (isGoalkeeper && careerCleanSheetStatus === 'error') ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
                          분기별 기록을 불러오지 못했습니다.
                        </p>
                      ) : bestFive.memberInfo === null || (isGoalkeeper && careerCleanSheetStatus !== 'ready') ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
                          분기별 기록을 불러오는 중입니다.
                        </p>
                      ) : chartQuarters.length > 0 ? (
                        <QuarterlyRecordChart
                          quarters={chartQuarters}
                          isGoalkeeper={isGoalkeeper}
                          currentQuarterKey={`${asOfDate.slice(0, 4)}-${Math.ceil(Number(asOfDate.slice(5, 7)) / 3)}`}
                        />
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">분기별 기록이 없습니다.</p>
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
            className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-center text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <div className="flex max-h-[85vh] flex-col">
              <div className="relative flex shrink-0 items-center justify-center gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h3 id="player-season-method-title" className="min-w-0 px-8 text-lg font-bold">
                  개인 최고 계절 선정 기준
                </h3>
                <form method="dialog" className="absolute right-3 top-3">
                  <button type="submit" className="rounded px-2 py-1 text-sm text-zinc-700 hover:underline dark:text-zinc-200">
                    닫기
                  </button>
                </form>
              </div>
              <div className="min-h-0 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
                <p>본인의 승점 생산률이 가장 높은 계절을 표시합니다.</p>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="font-semibold">표시 조건</dt>
                    <dd className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                      <p>계절 마다 2회 이상 출석해야 합니다.</p>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </dialog>
          <section aria-labelledby="analysis-season-title" hidden={!isSectionVisible('season')}>
            <AnalysisSectionHeading
              id="analysis-season-title"
              controls="season-analysis"
              title="이번 시즌"
              subtitle={`${thisYear} - 제 ${quarter} 시즌`}
              expanded={showSeason}
              focused={analysisView === 'season'}
              onToggle={() => selectAnalysisSection('season')}
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
                renderAnalysisRows(seasonAnalysisRows)
              )}
            </div>
          </section>
          <section aria-labelledby="analysis-career-title" hidden={!isSectionVisible('career')}>
            <AnalysisSectionHeading
              id="analysis-career-title"
              controls="career-analysis"
              title="통산 기록"
              expanded={showCareer}
              focused={analysisView === 'career'}
              onToggle={() => selectAnalysisSection('career')}
            />
            <div id="career-analysis" hidden={!showCareer}>
              <section aria-labelledby="career-cumulative-title">
                <h3
                  id="career-cumulative-title"
                  className="mt-4 analysis-career-subheading border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-zinc-700 font-dnf-forged dark:border-gray-700 dark:bg-gray-800 dark:text-zinc-200"
                >
                  최다 누적 TOP
                </h3>
                <div className="pt-4">{renderAnalysisRows(groupAnalysisRows(careerCumulativeItems), true)}</div>
              </section>
              <section aria-labelledby="career-daily-title">
                <h3
                  id="career-daily-title"
                  className="mt-8 analysis-career-subheading border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-zinc-700 font-dnf-forged dark:border-gray-700 dark:bg-gray-800 dark:text-zinc-200"
                >
                  일일 최다
                </h3>
                <div className="pt-4">{renderAnalysisRows(groupAnalysisRows(careerDailyItems))}</div>
              </section>
              <section aria-labelledby="career-special-title">
                <h3
                  id="career-special-title"
                  className="mt-8 analysis-career-subheading border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-zinc-700 font-dnf-forged dark:border-gray-700 dark:bg-gray-800 dark:text-zinc-200"
                >
                  스페셜
                </h3>
                <dl className="space-y-3 pt-4">
                  {careerOtherItems.map((item) => renderAnalysisItem({ ...item, career: true }))}
                </dl>
              </section>
            </div>
          </section>
        </div>

        <CareerRankingDialog
          dialogRef={careerRankingDialogRef}
          title={selectedCareerRanking?.title || ''}
          description={careerRankingDescriptions[selectedRankingKey]}
          entries={selectedRankingEntries}
          status={selectedRankingStatus}
          onClose={() => setSelectedCareerRanking(null)}
        />
        <dialog
          ref={seasonSpecialistDialogRef}
          id="season-specialist-method-dialog"
          aria-labelledby="season-specialist-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-center text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="relative flex items-center justify-center gap-4 px-8">
            <h3 id="season-specialist-method-title" className="text-lg font-bold">
              계절 에이스 선정 기준
            </h3>
            <form method="dialog" className="absolute right-0 top-0">
              <button type="submit" aria-label="선정 기준 닫기" className="rounded px-2 py-1 text-xl">
                X
              </button>
            </form>
          </div>
          <ul className="mt-4 list-inside list-disc space-y-3 text-sm leading-relaxed">
            <li>승점제가 도입된 2026년 이후 기록으로 비교합니다.</li>
            <li>네 계절 각각 3회 이상 출석한 플레이어 중</li>
            <li>해당 계절 승점생산률이 가장 높고 차선 계절과의 격차가 가장 큰 플레이어를 선정합니다.</li>
          </ul>
        </dialog>

        <dialog
          ref={bestFiveDialogRef}
          id="best-five-method-dialog"
          aria-labelledby="best-five-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-center text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="relative flex items-center justify-center gap-4 px-8">
            <h3 id="best-five-method-title" className="text-lg font-bold">
              BEST Ⅴ
            </h3>
            <form method="dialog" className="absolute right-0 top-0">
              <button type="submit" className="rounded px-2 py-1 text-xl">
                X
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>이번 시즌 출석일의 50% 이상 참석한 플레이어 중</p>
            <ul className="list-inside list-disc space-y-2 text-left">
              <li>ST: 골이 가장 많은 플레이어</li>
              <li>LM: 왼발잡이 중 어시가 가장 많은 플레이어</li>
              <li>RM: 오른발잡이 중 어시가 가장 많은 플레이어</li>
              <li>DF: 승점생산률이 가장 높은 플레이어</li>
              <li>
                GK: 클린시트가 가장 많은 플레이어<p className="pl-12">(없으면 승점생산률 최상위)</p>
              </li>
            </ul>
          </div>
        </dialog>

        <dialog
          ref={recentFormDialogRef}
          id="recent-form-method-dialog"
          aria-labelledby="recent-form-method-title"
          onClick={closeDialogOnBackdropClick}
          className="m-auto max-h-[85vh] w-[min(92vw,32rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-center text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="relative flex items-center justify-center gap-4 px-8">
            <h3 id="recent-form-method-title" className="text-lg font-bold">
              최근 상승세 계산 방식
            </h3>
            <form method="dialog" className="absolute right-0 top-0">
              <button type="submit" className="rounded px-2 py-1 text-xl">
                X
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>플레이어별 최근 출석 2회와 그 직전 출석 2회의 기록 합계를 비교합니다.</p>
            <p>두 지표 중 하나 이상 증가하고, 다른 지표는 감소하지 않은 플레이어</p>
            <ul className="list-inside list-disc space-y-2">
              <li>일반 플레이어: 공격포인트(골 + 어시)와 승점</li>
              <li>골키퍼: 클린시트와 승점</li>
              {/*<li>하락세: 두 지표 중 하나 이상 감소하고, 다른 지표는 증가하지 않은 플레이어</li>*/}
            </ul>
            <p className="text-gray-600 dark:text-gray-400">이번 시즌 2회 이상, 8주 이내에 총 4회 이상 출석해야 합니다.</p>
          </div>
        </dialog>
        <ScrollToTopButton />
      </>
    </div>
  )
}

export default AnalysisTap
