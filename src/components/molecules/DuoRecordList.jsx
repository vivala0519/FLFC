const DuoRecordList = ({ duos, muted = false }) => (
  <ul className="w-full divide-y divide-gray-100 dark:divide-gray-800">
    {duos.map(({ id, players, count, sharedDays }) => (
      <li key={id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
        <span className={`min-w-0 break-words [overflow-wrap:anywhere] ${muted
          ? 'text-sm text-gray-500 dark:text-gray-400'
          : 'font-semibold font-dnf-forged text-blueSignature dark:text-yellow-400'}`}>
          {players.join(' × ')}
        </span>
        <span className={`flex shrink-0 flex-col items-end whitespace-nowrap tabular-nums ${muted
          ? 'text-xs text-gray-500 dark:text-gray-400'
          : 'text-sm'}`}>
          {sharedDays !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">같은 팀 {sharedDays}회</span>
          )}
          <span>{sharedDays !== undefined && '합작 '}{count}골</span>
        </span>
      </li>
    ))}
  </ul>
)

export default DuoRecordList
