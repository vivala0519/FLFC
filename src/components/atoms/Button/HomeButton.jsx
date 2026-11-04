import ParticleText from '@/components/atoms/Text/ParticleText.jsx'

const HomeButton = () => {
  const titleStyle = 'relative font-giants text-[35px] text-blueSignature dark:text-blue-300 font-normal tracking-[3px]'
  const subTitleStyle = 'font-suite text-[9px] animate-pulse text-goal dark:text-red-300 font-extralight'

  return (
    <div className="flex shrink-0 flex-col items-start">
      <ParticleText className={titleStyle}>
        FLFC
      </ParticleText>
      <span className={subTitleStyle}>
        Football Love Futsal Club
      </span>
    </div>
  )
}

export default HomeButton
