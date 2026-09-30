import { useState } from 'react'
import RecordEntryForm from '@/components/molecules/RecordEntryForm.jsx'

const RecordEntryPreview = () => {
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  const [records, setRecords] = useState([])

  const registerHandler = () => {
    const goal = scorer.trim()
    if (!goal) return

    setRecords((current) => [
      { id: crypto.randomUUID(), goal, assist: assistant.trim() },
      ...current,
    ])
    setScorer('')
    setAssistant('')
  }

  return (
    <section className="flex w-full flex-col items-center px-4 pt-6 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-5 border-b border-gray-300 pb-3 dark:border-gray-700">
          <h1 className="text-lg font-semibold">골 · 어시 등록</h1>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            테스트 모드 · Firebase에 저장되지 않습니다
          </p>
        </div>
        <RecordEntryForm
          data={{ scorer, setScorer, assistant, setAssistant }}
          registerHandler={registerHandler}
        />
        <div className="mt-8 border-t border-gray-300 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">임시 등록 내역 ({records.length})</h2>
            {records.length > 0 && (
              <button
                type="button"
                className="text-sm text-blue-700 underline dark:text-blue-300"
                onClick={() => setRecords([])}
              >
                초기화
              </button>
            )}
          </div>
          {records.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">등록 내역이 없습니다</p>
          ) : (
            <ol className="mt-3 divide-y divide-gray-200 dark:divide-gray-700" aria-live="polite">
              {records.map(({ id, goal, assist }) => (
                <li key={id} className="flex gap-3 py-3 text-sm">
                  <span className="font-semibold">골 {goal}</span>
                  {assist && <span>어시 {assist}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}

export default RecordEntryPreview
