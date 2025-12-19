import { db } from '../../../firebase.js'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'

const DevPage = () => {

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

  return (
    <div>
      <button onClick={copyCollection}>컬렉션 복사</button>
    </div>
  )
}

export default DevPage