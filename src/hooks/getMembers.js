import { useAtom } from 'jotai'
import {
  totalMembersAtom,
  existingMembersAtom,
  retiredMembersAtom,
  membersIdAtom,
  oneCharacterMembersAtom,
  membersNickNameAtom,
} from '@/store/atoms'

const getMembers = () => {
  const [totalMembers] = useAtom(totalMembersAtom)
  const [existingMembers] = useAtom(existingMembersAtom)
  const [retiredMembers] = useAtom(retiredMembersAtom)
  const [oneCharacterMembers] = useAtom(oneCharacterMembersAtom)
  const [membersNickName] = useAtom(membersNickNameAtom)
  const [membersId] = useAtom(membersIdAtom)

  return {
    totalMembers,
    existingMembers,
    retiredMembers,
    oneCharacterMembers,
    membersNickName,
    membersId,
  }
}

export default getMembers
