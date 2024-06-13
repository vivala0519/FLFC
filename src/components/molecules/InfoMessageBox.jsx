const InfoMessageBox = (props) => {
  const {open} = props
  const boxStyle = `relative font-dnf-forged text-xs text-gray-400 ${open ? 'top-6' : 'bottom-[5px]'}`

  return (
    <div className={boxStyle}>
      <p className='mb-1 text-base text-black dark:text-white'>기록 가능 시간이 아닙니다.</p>
      <p>Open : 07:50 ~ 10:05 Sun.</p>
      {open && <p>기록은 오늘 하루 동안 유지됩니다.</p>}
    </div>
  )
}

export default InfoMessageBox