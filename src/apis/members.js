export const extractActiveMembers = (totalStats, isTotal) => {
  // 탈퇴자 포함 전 인원
  const totalNames = [
    "방승진",
    "임희재",
    "정우진",
    "한상태",
    "임건휘",
    "노태훈",
    "박근한",
    "전희종",
    "윤준석",
    "임종우",
    "김민관",
    "임동준",
    "윤희철",
    "임준휘",
    "이승호",
    "손지원",
    "윤영진",
    "진장용",
    "김남구",
    "이준영",
    "황은집",
    "김대건",
    "장성민",
    "이재진",
    "이원효",
    "최수혁",
    "이종호",
    "황정민",
    "김동휘",
    "안용현",
    "이진헌",
    "김민창",
    "이후현",
    "임호진",
    "김규진",
    "김동주",
    "김병일",
    "김성록",
    "박남호",
    "선우용",
    "양대열",
    "전의준",
    "차지수",
    "하민수",
    "홍원진",
    "우장식",
    "선민조",
    "황철민",
    "최봉호"
  ]
  // 현 인원
  const names = ['홍원진', '우장식', '임희재', '윤희철', '김동휘', '이승호', '임건휘', '방승진', '김민관', '김규진', '임준휘', '전희종', '한상태', '임종우', '노태훈', '윤영진', '이원효', '황정민', '양대열', '정우진', '김남구', '박근한', '손지원', '황철민', '최봉호', '선민조', '최수혁', '김병일', '김대건', '전의준', '황은집', '진장용', '이진헌', '윤준석', '김동주', '이재진', '김성록', '박남호', '장성민', '하민수']
  const members = isTotal ? totalNames : names
  const includedNames = members.filter(name => totalStats.has(name))
  const excludedNames = members.filter(name => !totalStats.has(name))

  return {active: includedNames, inactive: excludedNames}
}

export default extractActiveMembers