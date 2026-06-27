export const extractActiveMembers = (totalStats, members = []) => {
  const active = members.filter((name) => totalStats.has(name))
  const inactive = members.filter((name) => !totalStats.has(name))

  return { active, inactive }
}

export default extractActiveMembers
