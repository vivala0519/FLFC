import { useAtom } from 'jotai'
import { totalMembersAtom, existingMembersAtom } from '@/store/atoms'

const getMembers = () => {
  const [totalMembers] = useAtom(totalMembersAtom)
  const [existingMembers] = useAtom(existingMembersAtom)

  return { totalMembers, existingMembers }
};

export default getMembers