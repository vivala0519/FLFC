import { useState } from 'react'
import NewsPendingModal from '@/components/organisms/NewsPendingModal.jsx'

const NewsPreviewPage = ({ dateId }) => {
  const [open, setOpen] = useState(true)
  const previewPending = import.meta.env.DEV && new URLSearchParams(window.location.search).get('pending') === '1'
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">FLFC 주간신문</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">20{dateId.slice(0, 2)}.{dateId.slice(2, 4)}.{dateId.slice(4, 6)}</p>
      <button type="button" onClick={() => setOpen(true)}>신문 보기</button>
      <a href="/" className="text-sm underline">기록하기로 돌아가기</a>
      {open && <NewsPendingModal key={dateId} dateId={dateId} onDismiss={() => setOpen(false)} previewPending={previewPending} />}
    </main>
  )
}

export default NewsPreviewPage
