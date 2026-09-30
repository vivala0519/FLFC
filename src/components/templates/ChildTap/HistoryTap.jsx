import { useEffect, useMemo, useState } from 'react'
import { getAnalysisHistoryRecords } from '@/apis/analysisHistoryRecords.js'
import getMembers from '@/hooks/getMembers.js'
import styled from 'styled-components'
import trophy from '@/assets/trophy.png'
import goldenBoot from '@/assets/golden-boot.png'
import ballonDor from '@/assets/ballon-dor.png'
import ligueOne from '@/assets/ligue-1.png'
import coppaItalia from '@/assets/coppa-italia.png'

const careerAwardIcons = {
  득점왕: goldenBoot,
  승점왕: ballonDor,
  어시왕: ligueOne,
  출석왕: coppaItalia,
}

const historyRowClass = 'grid w-full grid-cols-[44px_repeat(4,minmax(0,1fr))] items-center text-center'
const orderMap = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 }
const awards = [
  ['point_king', '승점왕'],
  ['attendance_king', '출석왕'],
  ['goal_king', '득점왕'],
  ['assist_king', '어시왕'],
]
const normalizeWinners = (value) => (Array.isArray(value) ? value : [value])
  .filter((name) => typeof name === 'string' && name.trim())
  .map((name) => name.trim())

const HistoryTap = () => {
  const [history, setHistory] = useState({ status: 'loading', records: [] })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [blurMode, setBlurMode] = useState(true)
  const { retiredMembers } = getMembers()

  const historyData = useMemo(() => history.records.flatMap((record) => {
    const season = /^(\d{4})_(1st|2nd|3rd|4th)$/.exec(record?.id)
    if (!season) return []
    return [{
      id: record.id,
      year: Number(season[1]),
      quarter: orderMap[season[2]],
      winners: Object.fromEntries(awards.map(([key]) => [key, normalizeWinners(record.data?.[key])])),
    }]
  }).sort((a, b) => b.year - a.year || b.quarter - a.quarter), [history.records])

  const blurModeHandler = () => {
    setBlurMode(false)
  }

  useEffect(() => {
    let cancelled = false
    setHistory({ status: 'loading', records: [] })
    getAnalysisHistoryRecords().then((records) => {
      if (!cancelled) setHistory({ status: 'ready', records })
    }).catch((error) => {
      if (!cancelled) {
        console.error('Failed to load history records:', error)
        setHistory({ status: 'error', records: [] })
      }
    })
    return () => { cancelled = true }
  }, [loadAttempt])

  return (
    <>
      <div
        className={`${historyRowClass} sticky top-0 z-20 mt-3 border-t-2 border-t-gray-200 pt-2 pb-2 border-b-2 border-b-gray-200 bg-white text-sm dark:bg-gray-900 sm:text-base`}
      >
        <span></span>
        {awards.map(([key, title]) => (
          <div key={key} className="relative">
            <span className="absolute left-0 top-0.5">
              <img src={careerAwardIcons[title]} alt="" className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5" />
            </span>
            <span key={title} className="flex min-w-0 items-center justify-center gap-1 whitespace-nowrap">
              {title}
            </span>
          </div>
        ))}
      </div>
      {history.status === 'loading' ? (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400" role="status">
          히스토리를 불러오는 중입니다.
        </div>
      ) : history.status === 'error' ? (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400" role="alert">
          <p>히스토리를 불러오지 못했습니다.</p>
          <button
            type="button"
            className="mt-3 bg-transparent px-3 py-2 font-medium text-blue-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 dark:text-yellow-400"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            다시 불러오기
          </button>
        </div>
      ) : historyData.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400" role="status">
          등록된 히스토리가 없습니다.
        </div>
      ) : historyData.map((data) => (
        <div key={data.id} className={`${historyRowClass} mt-2 pb-2 border-b-2 border-b-gray-200 text-sm sm:text-base`}>
          <div className={'w-[44px] text-xs'}>
            <p>{data.year}</p>
            <p>{data.quarter}분기</p>
          </div>
          {awards.map(([key]) => (
            <span key={key} className="flex min-w-0 flex-col break-words">
              {data.winners[key].length > 0 ? data.winners[key].map((name, index) => (
                <span key={`${name}-${index}`} className={`${blurMode && retiredMembers.includes(name) ? 'blur-sm' : ''}`} onClick={blurModeHandler}>
                  {name}
                </span>
              )) : '-'}
            </span>
          ))}
        </div>
      ))}
    </>
  )
}

export default HistoryTap

const Trophy = styled.div`
  position: relative;
  width: 30px;
  height: 30px;
  &::after {
    position: absolute;
    content: '';
    background-image: url(${trophy});
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    width: 77%;
    height: 100%;
    left: 20%;
  }
`
