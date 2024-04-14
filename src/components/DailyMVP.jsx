import {useEffect, useState} from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import {db} from "../../firebase.js"
import JSConfetti from "js-confetti"
import styled from 'styled-components'
import './LetsRecord.css'

const DailyMVP = (props) => {
  const { setShowMVP, recordData, year, today } = props
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
    const dailyRecordMap = new Map()
    const data = recordData.find(data => data.id === today)
    if (data) {
      Object.entries(data.data).forEach(([key, value]) => {
        dailyRecordMap.set(key, {total: value['골'] + value['어시'], goal: value['골'], assist: value['어시']})
      })
    }

    // // 최다 공포 찾기
    let maxPlayers = []
    let maxValue = 0

    for (const [key, value] of dailyRecordMap.entries()) {
      if (value['total'] > maxValue) {
        maxPlayers = [{name: key, goal: value['goal'], assist: value['assist']}]
        maxValue = value['total']
      } else if (value['total'] === maxValue) {
        maxPlayers.push({name: key, goal: value['goal'], assist: value['assist']})
      }
    }
    setBestPlayers(maxPlayers)

  }, [recordData]);

  const registerDailyMVP = async () => {
    const docRef = doc(db, 'daily_mvp', today)
    const docSnap = await getDoc(docRef);
    const data = {}
    bestPlayers.forEach(player => {
      data[player.name] = {goal: player.goal, assist: player.assist}
    })
    if (!docSnap.exists()) {
      await setDoc(docRef, data)
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
      <Chicken className='absolute -top-6 right-1 text-yellow-600'>오늘 저녁은 치킨이닭!</Chicken>
      <MVPText>Daily MVP</MVPText>
      <DayText className='underline decoration-2 decoration-solid decoration-yellow-400'>{year.slice(2, 4) + today}</DayText>
      <div className='flex flex-row mt-5 gap-3 justify-center' style={{height: '35%', fontSize: bestPlayers.length > 2 ? '25px' : '27px'}}>
        {bestPlayers.map((player, index) => (
            <div key={index} className='flex flex-col'>
              <BestPlayer className='underline decoration-2 decoration-double decoration-yellow-400'>{player.name}</BestPlayer>
              <span className='text-rose-800 text-xs'>{Number(player.goal) > 0 && player.goal + '골'} {Number(player.assist) > 0 && player.assist + '어시'}</span>
            </div>
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
  @media (min-width: 812px) {
    width: 30%;
  }
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

const Chicken = styled.span`
  @media (min-width: 812px) {
    font-size: 15px;
  }
`
