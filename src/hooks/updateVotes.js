import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { getDatabase, onValue, ref } from 'firebase/database'
import { voteListAtom, timeAtom } from '@/store/atoms'

const updateVotes = () => {
  const [, setVoteList] = useAtom(voteListAtom)
  const [time] = useAtom(timeAtom)
  const { thisYear } = time

  useEffect(() => {
    const db = getDatabase()
    const voteListRef = ref(db, 'vote' + '/' + thisYear)
    onValue(voteListRef, (snapshot) => {
      const voteList = snapshot.val()
      setVoteList(voteList)
    })

  }, [setVoteList, thisYear])
};
export default updateVotes