import { db } from '../../../firebase.js'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import getMembers from '@/hooks/getMembers.js'

const DevPage = () => {
  const { existingMembers } = getMembers()


  const copyCollection = async () => {
    const collectionRef = collection(db, '2025')
    const snap = await getDocs(collectionRef)
    const writes = snap.docs.map((docSnap) => {
      const destDocRef = doc(db, '2025_dev', docSnap.id)
      console.log(docSnap.data())
      return setDoc(destDocRef, docSnap.data())
    })
    await Promise.all(writes)
  }

  const clickHandler = async () => {
    console.log(existingMembers)
    const newObj = {}
    existingMembers.forEach(member => {
      newObj[member] = {preferredFoot: 'R'}
    })

    const membersDocRef = doc(db, `members`, 'info')
    await setDoc(membersDocRef, newObj)
  }

  return (
    <div>
      <button>데이터 생성</button>
    </div>
  )
}

export default DevPage