const HomeButton = () => {
  const titleStyle = 'relative font-giants text-[35px] text-blueSignature font-normal left-[4px] tracking-[3px]'
  const subTitleStyle = 'mb-3 font-suite text-[9px] animate-pulse text-goal font-extralight'

  return (
    <>
      <span className={titleStyle}>
        FLFC
      </span>
      <span className={subTitleStyle}>
        Football Love Futsal Club
      </span>
    </>
)
}

export default HomeButton