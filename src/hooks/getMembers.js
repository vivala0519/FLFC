import { useAtom } from 'jotai'
import { totalMembersAtom, existingMembersAtom, membersIdAtom } from '@/store/atoms'

const getMembers = () => {
  const [totalMembers] = useAtom(totalMembersAtom)
  const [existingMembers] = useAtom(existingMembersAtom)
  const [membersId] = useAtom(membersIdAtom)

  return { totalMembers, existingMembers, membersId }
};

export default getMembers