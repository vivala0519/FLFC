import React from "react"
import LiveBadge from "./LiveBadge.jsx"

const ParentTap = (props) => {
  const { isLiveBadge, tapName, isActive, onClick } = props

  const tapStyle = 'relative cursor-pointer w-full whitespace-pre' + (isActive ? ' text-goal dark:text-yellow-400' : '')

  return (
    <div className={tapStyle} onClick={onClick}>
      <span className='relative'>
        {isLiveBadge && <LiveBadge />}
        {tapName}
      </span>
    </div>
  )
}

export default ParentTap