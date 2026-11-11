const closeOnBackdropClick = (event) => {
  if (event.target !== event.currentTarget) return
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
    event.currentTarget.close()
  }
}

const CareerRankingDialog = ({ dialogRef, title, description, entries = [], status = 'loading', onClose }) => {
  const topEntries = entries.filter(({ rank }) => Number.isFinite(rank) && rank > 0 && rank <= 10)
  const rankCounts = new Map()
  for (const { rank } of topEntries) rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1)

  return (
    <dialog
      ref={dialogRef}
      id="career-ranking-dialog"
      aria-labelledby="career-ranking-title"
      onClick={closeOnBackdropClick}
      onClose={onClose}
      className="m-auto max-h-[85vh] w-[min(92vw,36rem)] overflow-hidden rounded-lg border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 pl-8 pr-4 py-4 dark:border-gray-700 sm:px-5">
          <h3 id="career-ranking-title" className="min-w-0 break-keep text-lg font-bold font-dnf-forged flex gap-2 items-center">
            {title} <span className="whitespace-nowrap text-sm text-blue-700 dark:text-blue-300">TOP 10</span>
          </h3>
          <form method="dialog" className="shrink-0">
            <button
              type="submit"
              aria-label="순위 닫기"
              className="rounded px-2 py-1 text-sm text-zinc-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-zinc-200 dark:focus-visible:outline-blue-300"
            >
              닫기
            </button>
          </form>
        </div>
        <div key={title} className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
          {description && <p className="mb-4 break-keep text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}
          {status !== 'ready' ? (
            <p role={status === 'error' ? 'alert' : 'status'} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {status === 'error' ? '순위를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.' : '순위를 계산하는 중입니다.'}
            </p>
          ) : topEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">조건에 맞는 기록이 없습니다.</p>
          ) : (
            <table className="mx-auto w-full max-w-xs table-fixed text-sm">
              <caption className="sr-only">{title} 상위 10위 순위</caption>
              <colgroup>
                <col className="w-16" />
                <col />
                <col className="w-24" />
              </colgroup>
              <thead className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="pb-2 text-center font-medium">순위</th>
                  <th scope="col" className="pb-2 text-center font-medium">플레이어</th>
                  <th scope="col" className="pb-2 text-center font-medium">기록</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topEntries.map((entry) => (
                  <tr key={entry.id || entry.name}>
                    <td className="whitespace-nowrap py-3 text-center align-top text-xs tabular-nums text-gray-500 dark:text-gray-400">
                      {rankCounts.get(entry.rank) > 1 ? `공동 ${entry.rank}위` : `${entry.rank}위`}
                    </td>
                    <th scope="row" className="break-words py-3 text-center align-top font-normal">
                      <span className="font-semibold font-dnf-forged">{entry.name}</span>
                      {entry.detail && <span className="mt-1 block break-keep text-xs leading-relaxed text-gray-500 dark:text-gray-400">{entry.detail}</span>}
                    </th>
                    <td className="whitespace-nowrap py-3 text-center align-top font-medium tabular-nums">{entry.count ?? entry.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/*<p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">10위 동률은 모두 표시합니다.</p>*/}
        </div>
      </div>
    </dialog>
  )
}

export default CareerRankingDialog
