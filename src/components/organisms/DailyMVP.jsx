import { useEffect } from 'react'
import JSConfetti from 'js-confetti'
import Laurel from '@/components/atoms/Image/Laurel.jsx'
import MvpPlayer from '@/components/molecules/MvpPlayer.jsx'
import '../templates/ParentTap/LetsRecord.css'

const DailyMVP = (props) => {
  const { setShowMVP, bestPlayers, year, today } = props
  const yymmdd = year.slice(2, 4) + today
  // style class
  const mvpTextStyle = 'relative top-[1px] font-kbo text-[25px]'
  const closeMessageStyle = 'mt-3 relative text-sm text-gray-300 -bottom-[12%]'
  const chickenTextStyle =
    'absolute -top-2 right-1 text-assist desktop:text-[15px]'
  const playerListStyle = `flex flex-row mt-3 gap-3 justify-center z-10 h-[35%] ${bestPlayers.length > 2 ? 'text-[20px]' : 'text-[27px]'}`
  const dayTextStyle =
    'text-[10px] font-dnf text-vivaMagenta relative top-[1px] underline decoration-2 decoration-solid decoration-yellow-400'
  const popupContainerStyle =
    'text-assist w-full h-[200px] bg-white box cursor-pointer flex flex-col desktop:w-[30%]'
  useEffect(() => {
    if (!bestPlayers.length) return
    const confetti = new JSConfetti()
    const firework = () => {
      confetti.addConfetti({
        confettiNumber: 100,
        confettiRadius: 4,
        confettiColors: ['#EAB308', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
      })
      confetti.addConfetti({
        emojis: ['🍗'],
        emojiSize: 100,
        confettiNumber: 1,
      })
    }

    firework()
    const intervalId = setInterval(firework, 1000)
    let timeoutId
    let stopped = false
    const stopConfetti = () => {
      if (stopped) return
      stopped = true
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      confetti.clearCanvas()
      confetti.destroyCanvas()
    }

    timeoutId = setTimeout(stopConfetti, 3000)
    return stopConfetti
  }, [bestPlayers.length])

  if (!bestPlayers.length) return null

  return (
    <div className={popupContainerStyle} onClick={() => setShowMVP(false)}>
      <span className={chickenTextStyle}>오늘 저녁은 치킨이닭!</span>
      <span className={mvpTextStyle}>Daily MVP</span>
      <span className={dayTextStyle}>{yymmdd}</span>
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
