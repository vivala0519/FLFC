import { useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import {db} from '../../firebase.js'
import { useAtom } from 'jotai'
import { totalMembersAtom, existingMembersAtom } from '@/store/atoms'

const updateMembers = () => {
  const [, setTotalMembers] = useAtom(totalMembersAtom)
  const [, setExistingMembers] = useAtom(existingMembersAtom)

  useEffect(() => {
    const fetchMembersData = async () => {
      const membersRef = collection(db, 'members')
      const membersSnapshot = await getDocs(membersRef)
      const fetchedMembersData = membersSnapshot.docs.find(doc => doc.id === 'members')?.data()
      const totalMembers = fetchedMembersData.total
      const retiredMembers = fetchedMembersData.retired
      setTotalMembers(totalMembers)
      setExistingMembers(totalMembers.filter(member => !retiredMembers.includes(member)))
    };

    fetchMembersData()
  }, [])

}

export default updateMembers