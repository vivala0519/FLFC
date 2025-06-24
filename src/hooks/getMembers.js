import { useAtom } from 'jotai'
import {
  totalMembersAtom,
  existingMembersAtom,
  retiredMembersAtom,
  membersIdAtom,
  oneCharacterMembersAtom,
} from '@/store/atoms'

const getMembers = () => {
  const [totalMembers] = useAtom(totalMembersAtom)
  const [existingMembers] = useAtom(existingMembersAtom)
  const [retiredMembers] = useAtom(retiredMembersAtom)
  const [oneCharacterMembers] = useAtom(oneCharacterMembersAtom)
  const [membersId] = useAtom(membersIdAtom)

  return {
    totalMembers,
    existingMembers,
    retiredMembers,
    oneCharacterMembers,
    membersId,
  }
}

export default getMembers
