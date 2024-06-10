const HomeButton = () => {
  const titleStyle = 'relative font-giants text-[35px] text-green-800 font-normal left-[4px] tracking-[3px]'
  const subTitleStyle = 'mb-3 font-suite text-[8px] text-yellow-500 font-extralight'

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