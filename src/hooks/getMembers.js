import { useAtom } from 'jotai'
import {
  totalMembersAtom,
  existingMembersAtom,
  membersIdAtom,
  oneCharacterMembersAtom,
} from '@/store/atoms'

const getMembers = () => {
  const [totalMembers] = useAtom(totalMembersAtom)
  const [existingMembers] = useAtom(existingMembersAtom)
  const [oneCharacterMembers] = useAtom(oneCharacterMembersAtom)
  const [membersId] = useAtom(membersIdAtom)

  return { totalMembers, existingMembers, oneCharacterMembers, membersId }
}

export default getMembers
