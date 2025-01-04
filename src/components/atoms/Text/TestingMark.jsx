const TestingMark = (props) => {
  const { locationStyle } = props
  const badgeStyle =
    'transform rotate-[17deg] text-red-600 border-t-2 border-b-2 border-red-600 ' +
    locationStyle

  return <span className={badgeStyle}>테스트 중</span>
}

export default TestingMark
