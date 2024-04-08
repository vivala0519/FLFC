import {useEffect, useState} from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import {db} from "../../firebase.js"
import JSConfetti from "js-confetti"
import styled from 'styled-components'
import './LetsRecord.css'

const DailyMVP = (props) => {
  const { setShowMVP, todayRecord, year, today, players } = props
  const [bestPlayers, setBestPlayers] = useState([])
  const confetti = new JSConfetti()

  const firework = () => {
    confetti.addConfetti({
      confettiNumber: 100,
      confettiRadius: 4,
      confettiColors: ['#EAB308', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
    })
  }

  useEffect(() => {
    firework()
    const intervalId = setInterval(firework, 1000);

    setTimeout(() => {
      clearInterval(intervalId)
      const canvasElements = document.getElementsByTagName('canvas')
      while (canvasElements.length > 0) {
        canvasElements[0].parentNode.removeChild(canvasElements[0])
      }
    }, 5000);
  }, []);

  useEffect(() => {
    // 이름별 포인트 합산 계산
    const dailyRecordMap = new Map()

    todayRecord.forEach(record => {
      let scorerName = record.goal.trim() !== '용병' ? record.goal.trim() : null
      let assistantName = record.assist.trim() ? record.assist.trim() !== '용병' ? record.assist.trim() : null : null

      if (scorerName) {
        if (dailyRecordMap.has(scorerName)) {
          const goalCount = dailyRecordMap.get(scorerName)
          dailyRecordMap.set(scorerName, goalCount + 1)
        } else {
          dailyRecordMap.set(scorerName, 1)
        }
      }

      if (assistantName) {
        if (dailyRecordMap.has(assistantName)) {
          const assistCount = dailyRecordMap.get(assistantName)
          dailyRecordMap.set(assistantName, assistCount + 1)
        } else {
          dailyRecordMap.set(assistantName, 1)
        }
      }
    })

    // 최다 공포 찾기
    let maxPlayers = []
    let maxValue = 0

    for (const [key, value] of dailyRecordMap.entries()) {
      if (value > maxValue) {
        maxPlayers = [key]
        maxValue = value
      } else if (value === maxValue) {
        maxPlayers.push(key)
      }
    }

    if (maxPlayers.length > 0 && maxPlayers.length < 4) {
      const maxPlayersFullName = []
      players.forEach(player => {
        maxPlayers.forEach(max => {
          if (player.includes(max)) {
            maxPlayersFullName.push(player)
          }
        })
      })
      setBestPlayers(maxPlayersFullName)
    }

  }, [todayRecord])

  const registerDailyMVP = async () => {
    const docRef = doc(db, 'daily_mvp', today)
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {bestPlayers: bestPlayers})
    }
  }

  useEffect(() => {
    if (bestPlayers.length > 3) {
      setShowMVP(false)
    } else {
      registerDailyMVP()
    }
  }, [bestPlayers])

  const closeHandler = () => {
    setShowMVP(false)
    // firework()
  }

  return (
    <MVP className='box cursor-pointer flex flex-col' onClick={closeHandler}>
      <MVPText>Daily MVP</MVPText>
      <DayText className='underline decoration-2 decoration-solid decoration-yellow-400'>{year.slice(2, 4) + today}</DayText>
      <div className='flex flex-row mt-5 gap-3 justify-center' style={{height: '35%', fontSize: bestPlayers.length > 2 ? '25px' : '27px'}}>
        {bestPlayers.map((player, index) => (
          <BestPlayer className='underline decoration-2 decoration-double decoration-yellow-400' key={index}>{player}</BestPlayer>
        ))}
      </div>
      <Close className='relative text-sm text-gray-300'>터치하면 사라집니다</Close>
    </MVP>
  )
}

export default DailyMVP

const MVP = styled.div`
  position: absolute;
  z-index: 1;
  color: #EAB308;
  top: 30%;
  width: 90%;
  height: 200px;
  background-color: white;
`

const MVPText = styled.span`
  font-size: 25px;
  font-family: 'KBO-Dia-Gothic_bold', serif;
  position: relative;
  top: 1px;
`

const DayText = styled.span`
    font-size: 10px;
    font-family: 'DNFForgedBlade', serif;
    color: #BB2649;
    position: relative;
    top: 1px;
`

const BestPlayer = styled.span`
  font-family: 'DNFForgedBlade', serif;
  color: #166534;
`

const Close = styled.span`
  bottom: -12%;
`
