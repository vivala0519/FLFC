const TapTitleText = (props) => {
  const { active, title } = props
  const titleStyle =
    'relative bottom-1 mt-3 mb-1 underline underline-offset-1 font-dnf-forged' +
    (active ? ' text-goal' : ' text-[#213547] dark:text-gray-100')
  return <span className={titleStyle}>{title}</span>
}

export default TapTitleText
