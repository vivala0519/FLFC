const gloveOutline = 'M9 32v-3c-2-2-3-4-4-6l-3-5c-1-2 1-4 3-2l3 4V8a2 2 0 0 1 4 0v9-12a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v11-7a2 2 0 0 1 4 0v13c0 3-2 5-2 8Z'

const GoalkeeperBadge = ({ memberInfo, imageSrc, className = 'h-8 w-8 shrink-0' }) => {
  if (memberInfo?.goalKeeper !== true && memberInfo?.goalkeeper !== true) return null

  if (imageSrc) {
    return <img src={imageSrc} alt="골키퍼" title="골키퍼" width="32" height="32" className={`${className} object-contain`} />
  }

  return (
    <svg role="img" aria-label="골키퍼" className={className} viewBox="0 0 64 64"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>골키퍼</title>
      {['rotate(-42 32 32) translate(16 12)', 'rotate(42 32 32) translate(48 12) scale(-1 1)'].map((transform) => (
        <g key={transform} transform={transform}>
          <path d={gloveOutline} className="fill-white dark:fill-gray-900" />
          <rect x="9" y="32" width="13" height="8" rx="1" className="fill-white dark:fill-gray-900" />
          <path d="M12 35h7" />
          <path d="m11 22 4 4 5-4" opacity="0.6" />
        </g>
      ))}
    </svg>
  )
}

export default GoalkeeperBadge
