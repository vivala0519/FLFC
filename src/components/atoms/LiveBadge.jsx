const LiveBadge = ({ positionClassName = 'bottom-4 left-[-13px]' }) => {
  const badgeStyle = `absolute text-[9px] text-[#bb2649] dark:text-red-300 font-dnf-bit transform rotate-[-17deg] animate-pulse ${positionClassName}`

  return (
    <span className={badgeStyle}>
      Live
    </span>
  )
}

export default LiveBadge
