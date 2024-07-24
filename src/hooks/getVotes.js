import { useAtom } from 'jotai'
import { voteListAtom } from '@/store/atoms'

const getVotes = () => {
  const [voteList] = useAtom(voteListAtom)
  return { voteList }
};

export default getVotes