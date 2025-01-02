import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { getDatabase, onValue, ref } from 'firebase/database'
import { voteListAtom } from '@/store/atoms'

const updateVotes = () => {
  const [, setVoteList] = useAtom(voteListAtom)
  const now = new Date()
  const nextSunday = new Date(now)
  nextSunday.setDate(now.getDate() + (7 - now.getDay()))

  const yy = String(nextSunday.getFullYear())

  useEffect(() => {
    const db = getDatabase()
    const voteListRef = ref(db, 'vote' + '/' + yy)
    onValue(voteListRef, (snapshot) => {
      const voteList = snapshot.val()
      setVoteList(voteList)
    })
  }, [setVoteList])
}
export default updateVotes
