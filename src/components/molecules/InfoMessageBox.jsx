const InfoMessageBox = (props) => {
  const {open, isOffDay = false} = props
  const boxStyle = `relative font-dnf-forged text-xs text-gray-400 bg-blue-50 dark:bg-gray-700 pb-6 pt-6 ${open ? 'pt-6' : 'bottom-[5px]'}`

  return (
    <div className={boxStyle}>
      <p className="mb-1 text-base text-black dark:text-white">{isOffDay ? '경기 없는 날🍃' : '기록 가능 시간이 아닙니다.'}</p>
      {!isOffDay && <p>Open : 07:50 ~ 10:00 Sun.</p>}
    </div>
  )
}

export default InfoMessageBox
