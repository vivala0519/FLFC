const ShowRequestButton = (props) => {
  const { setRequestUpdateMode } = props
  const buttonStyle = 'bg-request bg-[length:100%_100%] w-[60px] h-[60px] absolute right-0 top-6 cursor-pointer'

  return (
    <div className={buttonStyle} onClick={() => setRequestUpdateMode(true)}>
      <div className='flex flex-col relative top-4'>
        <span className='text-white' style={{fontSize: '12px'}}>수정</span>
        <span className='text-white' style={{fontSize: '12px'}}>요청</span>
      </div>
    </div>
  )
}

export default ShowRequestButton