import { useEffect, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
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

const HistoryTap = () => {
  const [historyData, setHistoryData] = useState([])
  const [blurMode, setBlurMode] = useState(true)
  const { retiredMembers } = getMembers()

  const orderMap = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 }


  const getHistoryData = async () => {
    const historyRef = collection(db, 'history')
    const historySnapshot = await getDocs(historyRef)
    const fetchedData = historySnapshot.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .filter((data) => !['changed_last_season', 'last_season'].includes(data.id))
      .sort((a, b) => b.id - a.id)

    const sortedHistoryData = [...fetchedData].sort((a, b) => {
      const [ay, ao] = String(a.id).split('_')
      const [by, bo] = String(b.id).split('_')

      const yearDiff = Number(by) - Number(ay)
      if (yearDiff !== 0) return yearDiff

      return (orderMap[bo] ?? -Infinity) - (orderMap[ao] ?? -Infinity)
    })

    setHistoryData(sortedHistoryData)
  }

  const blurModeHandler = () => {
    setBlurMode(false)
  }

  useEffect(() => {
    getHistoryData()
  }, [])

  return (
    <>
      <div
        className={`${historyRowClass} sticky top-0 z-20 mt-3 border-t-2 border-t-gray-200 pt-2 pb-2 border-b-2 border-b-gray-200 bg-white text-sm dark:bg-gray-900 sm:text-base`}
      >
        <span></span>
        {['승점왕', '출석왕', '득점왕', '어시왕'].map((title) => (
          <div key={title} className="relative">
            <span className="absolute left-0 top-0.5">
              <img src={careerAwardIcons[title]} alt="" className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5" />
            </span>
            <span key={title} className="flex min-w-0 items-center justify-center gap-1 whitespace-nowrap">
              {title}
            </span>
          </div>
        ))}
      </div>
      {historyData.map((data, index) => (
        <div key={index} className={`${historyRowClass} mt-2 pb-2 border-b-2 border-b-gray-200 text-sm sm:text-base`}>
          <div className={'w-[44px] text-xs'}>
            <p>{data.id.slice(0, 4)}</p>
            <p>{data.id.split('_')[1].slice(0, 1)}분기</p>
          </div>
          <span
            className={`min-w-0 break-words ${blurMode && retiredMembers.includes(data.data['point_king']) ? 'blur-sm' : ''}`}
            onClick={blurModeHandler}
          >
            {data.data['point_king']}
          </span>
          <span className="flex min-w-0 flex-col break-words">
            {data.data['attendance_king'].map((name, idx) => (
              <span key={idx} className={`${blurMode && retiredMembers.includes(name) ? 'blur-sm' : ''}`} onClick={blurModeHandler}>
                {name}
              </span>
            ))}
          </span>
          <span
            className={`min-w-0 break-words ${blurMode && retiredMembers.includes(data.data['goal_king']) ? 'blur-sm' : ''}`}
            onClick={blurModeHandler}
          >
            {data.data['goal_king']}
          </span>
          <span
            className={`min-w-0 break-words ${blurMode && retiredMembers.includes(data.data['assist_king']) ? 'blur-sm' : ''}`}
            onClick={blurModeHandler}
          >
            {data.data['assist_king']}
          </span>
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
