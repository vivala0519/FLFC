import {useEffect, useState} from "react"
import {doc, collection, setDoc, getDocs} from "firebase/firestore"
import {db} from "../../../firebase.js"
import JSConfetti from "js-confetti"
import Laurel from '@/components/atoms/Image/Laurel.jsx'
import MvpPlayer from '@/components/molecules/MvpPlayer.jsx'
import '../templates/ParentTap/LetsRecord.css'

const DailyMVP = (props) => {
  const { setShowMVP, recordData, year, today } = props
  const [bestPlayers, setBestPlayers] = useState([])
  const confetti = new JSConfetti()
  // style class
  const popupContainerStyle = 'absolute z-10 text-assist top-[30%] w-[90%] h-[200px] bg-white box cursor-pointer flex flex-col desktop:w-[30%]'
  const chickenTextStyle = 'absolute -top-6 right-1 text-assist desktop:text-[15px]'
  const mvpTextStyle = 'relative top-[1px] font-kbo text-[25px]'
  const dayTextStyle = 'text-[10px] font-dnf text-vivaMagenta relative top-[1px] underline decoration-2 decoration-solid decoration-yellow-400'
  const closeMessageStyle = 'mt-3 relative text-sm text-gray-300 -bottom-[12%]'
  const playerListStyle = `flex flex-row mt-3 gap-3 justify-center z-10 h-[35%] ${bestPlayers.length > 2 ? 'text-[20px]' : 'text-[27px]'}`
  // confetti 상수
  const CONFETTI_NUMBER = 100
  const CONFETTI_RADIUS = 4
  const CONFETTI_COLORS = ['#EAB308', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
  const EMOJI_SIZE = 100
  const FIREWORK_INTERVAL = 1000
  const FIREWORK_DURATION = 3000

  const firework = (confetti) => {
    confetti.addConfetti({
      confettiNumber: CONFETTI_NUMBER,
      confettiRadius: CONFETTI_RADIUS,
      confettiColors: CONFETTI_COLORS
    })
    confetti.addConfetti({
      emojis: ["🍗"],
      emojiSize: EMOJI_SIZE,
      confettiNumber: 1,
    })
  }

  useEffect(() => {
    firework(confetti)
    const intervalId = setInterval(() => firework(confetti), FIREWORK_INTERVAL);

    setTimeout(() => {
      clearInterval(intervalId)
      const canvasElements = document.getElementsByTagName('canvas')
      while (canvasElements.length > 0) {
        canvasElements[0].parentNode.removeChild(canvasElements[0])
      }
    }, FIREWORK_DURATION)
  }, [])


  useEffect(() => {
    const dailyRecordMap = new Map()
    const data = recordData.find(data => data.id === today)
    if (data) {
      Object.entries(data.data).forEach(([key, value]) => {
        dailyRecordMap.set(key, {total: value['골'] + value['어시'], goal: value['골'], assist: value['어시']})
      })
    }

    // 최다 공포 찾기
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

  }, [recordData])

  // MVP 등록
  const registerDailyMVP = async () => {
    const mvpRef = collection(db, 'daily_mvp')
    const mvpSnapshot = await getDocs(mvpRef)
    const dailyMVPDocRef = doc(db, `daily_mvp`, today)

    const todayMVP = mvpSnapshot.docs.find(doc => doc.id === today)
    console.log(bestPlayers)

    if (todayMVP?.id !== today && bestPlayers.length > 0) {
      await setDoc(dailyMVPDocRef, {bestPlayers})
    }
  }

  useEffect(() => {
    if (bestPlayers.length > 5) {
      setShowMVP(false)
    } else {
      registerDailyMVP()
    }
  }, [bestPlayers])

  return (
    <div className={popupContainerStyle} onClick={() => setShowMVP(false)}>
      <span className={chickenTextStyle}>오늘 저녁은 치킨이닭!</span>
      <span className={mvpTextStyle}>Daily MVP</span>
      <span className={dayTextStyle}>{year.slice(2, 4) + today}</span>
      <Laurel />
      <div className={playerListStyle}>
        {bestPlayers.map((player, index) => (
          <MvpPlayer key={index} player={player} />
        ))}
      </div>
      <span className={closeMessageStyle}>터치하면 사라집니다</span>
    </div>
  )
}

export default DailyMVP