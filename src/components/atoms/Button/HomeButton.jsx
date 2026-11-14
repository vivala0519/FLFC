import ParticleText from '@/components/atoms/Text/ParticleText.jsx'

const HomeButton = () => {
  const titleStyle = 'relative font-giants text-[35px] text-blueSignature dark:text-blue-300 font-normal left-[4px] tracking-[3px]'
  const subTitleStyle = 'mb-3 font-suite text-[9px] animate-pulse text-goal dark:text-red-300 font-extralight'

  return (
    <>
      <ParticleText className={titleStyle}>
        FLFC
      </ParticleText>
      <span className={subTitleStyle}>
        Football Love Futsal Club
      </span>
    </>
)
}

export default HomeButton
