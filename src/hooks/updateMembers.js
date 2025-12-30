import { useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useAtom } from 'jotai'
import {
  totalMembersAtom,
  existingMembersAtom,
  retiredMembersAtom,
  membersIdAtom,
  oneCharacterMembersAtom,
  membersNickNameAtom,
} from '@/store/atoms'

const updateMembers = () => {
  const [, setTotalMembers] = useAtom(totalMembersAtom)
  const [, setExistingMembers] = useAtom(existingMembersAtom)
  const [, setRetiredMembers] = useAtom(retiredMembersAtom)
  const [, setOneCharacterMembers] = useAtom(oneCharacterMembersAtom)
  const [, setMembersNickName] = useAtom(membersNickNameAtom)
  const [, setMembersId] = useAtom(membersIdAtom)

  useEffect(() => {
    const fetchMembersData = async () => {
      const membersRef = collection(db, 'members')
      const membersSnapshot = await getDocs(membersRef)
      const fetchedMembersData = membersSnapshot.docs
        .find((doc) => doc.id === 'members')
        ?.data()
      const totalMembers = fetchedMembersData['total']
      const retiredMembers = fetchedMembersData['retired']
      const oneCharacterMembers = fetchedMembersData['oneCharacter']
      const membersNickName = fetchedMembersData['nickName']
      setTotalMembers(totalMembers)
      setExistingMembers(
        totalMembers.filter((member) => !retiredMembers.includes(member)),
      )
      setRetiredMembers(retiredMembers)
      setOneCharacterMembers(oneCharacterMembers)
      setMembersNickName(membersNickName)

      const fetchedMembersIdData = membersSnapshot.docs
        .find((doc) => doc.id === 'members_id')
        ?.data()
      setMembersId(fetchedMembersIdData)
    }

    fetchMembersData()
  }, [])
}

export default updateMembers
