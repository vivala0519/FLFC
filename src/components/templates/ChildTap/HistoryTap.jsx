import { useEffect, useState } from 'react'
import { db } from '../../../../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
import getMembers from '@/hooks/getMembers.js'
import styled from 'styled-components'
import trophy from '@/assets/trophy.png'

const HistoryTap = () => {
  const [historyData, setHistoryData] = useState([])
  const [blurMode, setBlurMode] = useState(true)
  const { retiredMembers } = getMembers()

  const getHistoryData = async () => {
    const historyRef = collection(db, 'history')
    const historySnapshot = await getDocs(historyRef)
    const fetchedData = historySnapshot.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .filter(
        (data) => !['changed_last_season', 'last_season'].includes(data.id),
      )
    setHistoryData(fetchedData)
  }

  const blurModeHandler = () => {
    setBlurMode(false)
  }

  useEffect(() => {
    getHistoryData()
  }, [])

  return (
    <>
      <div className="w-full flex justify-around mt-3 border-t-2 border-t-gray-200 pt-2 pb-2 border-b-2 border-b-gray-200">
        <Trophy style={{ width: '40px' }}></Trophy>
        <span className="flex items-center">출석왕</span>
        <span className="flex items-center">득점왕</span>
        <span className="flex items-center">어시왕</span>
      </div>
      {historyData.map((data, index) => (
        <div
          key={index}
          className="w-full flex justify-around mt-2 pb-2 items-center border-b-2 border-b-gray-200"
        >
          <span style={{ width: '40px' }}>
            {index === 0 ? '초' : index + 1}대
          </span>
          <span className="flex flex-col">
            {data.data['attendance_king'].map((name, idx) => (
              <span
                key={idx}
                className={`${blurMode && retiredMembers.includes(name) ? 'blur-sm' : ''}`}
                onClick={blurModeHandler}
              >
                {name}
              </span>
            ))}
          </span>
          <span
            className={`${blurMode && retiredMembers.includes(data.data['goal_king']) ? 'blur-sm' : ''}`}
            onClick={blurModeHandler}
          >
            {data.data['goal_king']}
          </span>
          <span
            className={`${blurMode && retiredMembers.includes(data.data['assist_king']) ? 'blur-sm' : ''}`}
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
