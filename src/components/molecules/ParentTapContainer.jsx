import React from 'react'
import ParentTap from "@/components/atoms/ParentTap.jsx"
import SpinningSun from "@/components/atoms/Image/SpinningSun.jsx"

const ParentTapContainer = (props) => {
  const { tapInfo, liveBadgeInfo } = props
  const { tap, setTap } = tapInfo
  const { isLive, weeklyTeamIsLive } = liveBadgeInfo
  const tapName = ['기록하기', '현황판', '기록실' ,'이번주 팀']

  const tapContainerStyle = 'flex flex-row justify-around w-full border-double border-0 border-b-2 border-t-2 border-green-600 mb-5 p-2'

  return (
    <div className={tapContainerStyle} style={{fontFamily: 'DNFForgedBlade'}}>
      {tapName.map((name, index) => (
        <React.Fragment key={index}>
          <ParentTap
            onClick={() => setTap(index)}
            isActive={tap === index}
            isLiveBadge={(isLive && index === 0) || (index === 1) || (weeklyTeamIsLive && index === 3)}
            tapName={name} />
          {index < 3 && <SpinningSun />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default ParentTapContainer
