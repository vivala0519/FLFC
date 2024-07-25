import {useEffect, useState} from "react";

const FootBallRadio = (props) => {
  const { type, checked } = props

  // style
  const itemStyle = `w-[20px] h-[20px] bg-[length:100%_100%] `
  const attendBG = 'bg-[url("@/assets/keep_ball.png")]'
  const absentBG = 'bg-[url("@/assets/uncheck_ball.png")]'
  const keepBG = 'bg-[url("@/assets/check_ball.png")]'
  const defaultBG = 'border-2 rounded-full border-gray-400 w-[20px] h-[20px]'
  const [bg, setBg] = useState(defaultBG)

  useEffect(() => {
    if (checked) {
      if (['monthAttend', 'weekAttend'].includes(type)) {
        setBg(itemStyle + attendBG)
      } else if (type === 'absent') {
        setBg(itemStyle + absentBG)
      } else {
        setBg(itemStyle + keepBG)
      }
    } else {
      setBg(defaultBG)
    }

  }, [type, checked]);


  return (
      <div className={bg} />
  )
}

export default FootBallRadio