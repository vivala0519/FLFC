import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { analyzeBestFive } from '../apis/analyzeBestFive.js'

export default function useBestFive(year, month) {
  const [result, setResult] = useState({ status: 'loading', positions: null })

  useEffect(() => {
    let cancelled = false
    let failed = false
    let records = null
    let memberInfo = null
    setResult({ status: 'loading', positions: null })

    const update = () => {
      if (!cancelled && !failed && records !== null && memberInfo !== null) {
        setResult({ status: 'ready', positions: analyzeBestFive(records, memberInfo, month) })
      }
    }
    const fail = () => {
      failed = true
      if (!cancelled) setResult({ status: 'error', positions: null })
    }

    const unsubscribeRecords = onSnapshot(collection(db, String(year)), (snapshot) => {
      records = snapshot.docs.map((document) => ({ id: document.id, data: document.data() }))
      update()
    }, fail)
    const unsubscribeInfo = onSnapshot(doc(db, 'members', 'info'), (snapshot) => {
      memberInfo = snapshot.data() || {}
      update()
    }, fail)

    return () => {
      cancelled = true
      unsubscribeRecords()
      unsubscribeInfo()
    }
  }, [year, month])

  return result
}
