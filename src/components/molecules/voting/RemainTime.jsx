import { useEffect, useState } from 'react'

const RemainTime = (props) => {
  const { setEndVote } = props
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    let today = new Date()
    const currentDay = today.getDay()
    if (currentDay > 3) {
      setDisplayText('마감된 투표입니다')
      setEndVote(true)
    } else {
      const daysUntilThursday = (4 - currentDay + 7) % 7

      const thursdayMidnight = new Date(today)
      thursdayMidnight.setDate(today.getDate() + daysUntilThursday)
      thursdayMidnight.setHours(0, 0, 0, 0)

      const timeDifference = thursdayMidnight - today
      const millisecondsInADay = 1000 * 60 * 60 * 24
      const millisecondsInAnHour = 1000 * 60 * 60
      const millisecondsInAMinute = 1000 * 60

      const daysRemaining = Math.floor(timeDifference / millisecondsInADay)
      const hoursRemaining = Math.floor(
        (timeDifference % millisecondsInADay) / millisecondsInAnHour,
      )
      const minutesRemaining = Math.floor(
        (timeDifference % millisecondsInAnHour) / millisecondsInAMinute,
      )

      if (daysRemaining > 0) {
        setDisplayText('투표 종료까지 ' + daysRemaining + '일 남았습니다.')
      } else if (hoursRemaining > 0) {
        setDisplayText('투표 종료까지 ' + hoursRemaining + '시간 남았습니다.')
      } else {
        setDisplayText('투표 종료까지 ' + minutesRemaining + '분 남았습니다.')
      }
    }
  }, [])

  const elementStyle = 'animate-bounceUpDown absolute top-8'

  return (
    <div className={elementStyle}>
      <span>{displayText}</span>
    </div>
  )
}

export default RemainTime
