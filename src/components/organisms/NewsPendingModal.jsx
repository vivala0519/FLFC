import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase.js'
import WeeklyNewsArticle from './WeeklyNewsArticle.jsx'
import typingTiger from '@/assets/news-typing-tiger.webp'
import stillTiger from '@/assets/news-typing-tiger-still.webp'

const NewsPendingModal = ({ dateId, onDismiss, previewPending = false }) => {
  const dialogRef = useRef(null)
  const [status, setStatus] = useState('checking')
  const [dismissed, setDismissed] = useState(false)
  const [news, setNews] = useState(null)
  const isPendingPreview = import.meta.env.DEV && previewPending

  useEffect(() => {
    if (dismissed) return undefined
    if (isPendingPreview) {
      setStatus('missing')
      return undefined
    }
    return onSnapshot(doc(db, 'news', dateId), { includeMetadataChanges: true }, (snapshot) => {
      if (snapshot.exists()) {
        setNews(snapshot.data())
        setStatus('ready')
      }
      // An empty local cache does not confirm that the server document is missing.
      else if (!snapshot.metadata.fromCache) setStatus('missing')
    }, (error) => {
      console.error('Failed to check weekly news:', error)
      setStatus('error')
    })
  }, [dateId, dismissed, isPendingPreview])

  const visible = !dismissed && status !== 'checking'
  useEffect(() => {
    if (visible && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [visible])

  if (!visible) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="news-pending-title"
      aria-describedby={status === 'ready' ? undefined : 'news-pending-description'}
      onClose={() => { setDismissed(true); onDismiss?.() }}
      className={status === 'ready' ? 'weekly-news-modal' : 'm-auto w-[min(92vw,28rem)] rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-900 shadow-xl backdrop:bg-black/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'}
    >
      {status === 'ready' ? (
        <WeeklyNewsArticle news={news} dateId={dateId} onClose={() => dialogRef.current?.close()} />
      ) : <>
      <form method="dialog" className="mb-3 flex justify-end">
        <button type="submit" aria-label="닫기" className="h-8 w-8 rounded text-xl">X</button>
      </form>
      {status === 'missing' && (
        <picture className="mx-auto mb-4 block h-52 w-52 max-w-full" aria-hidden="true">
          <source media="(prefers-reduced-motion: reduce)" srcSet={stillTiger} />
          <img src={typingTiger} width="480" height="480" alt="" className="h-full w-full object-contain" />
        </picture>
      )}
      <h2 id="news-pending-title" className="text-base font-semibold">
        {status === 'error' ? '기사를 확인하지 못했습니다' : '백호가 경기 결과를 작성중입니다'}
      </h2>
      <p id="news-pending-description" className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        {status === 'error' ? '잠시 후 다시 확인해 주세요' : '잠시만 기다려 주세요'}
      </p>
      </>}
    </dialog>
  )
}

export default NewsPendingModal
