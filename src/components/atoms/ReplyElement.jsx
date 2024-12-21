const ReplyElement = (props) => {
  const { reply, deleteHandler, userInfo } = props

  const elementStyle = 'flex justify-between p-2 h-[80px]'
  const contentStyle = 'flex flex-col'
  const textStyle = 'text-left'
  const additionalText = [0, 1].includes(reply.type) ? '합니다' : ''

  const formatTime = (time) => {
    let formattedDate = new Date(time)
    let hours = formattedDate.getHours()
    const minutes = formattedDate.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? '오후' : '오전'
    hours = hours % 12 || 12
    const hoursStr = Number(hours.toString().padStart(2, '0'))

    const month = Number((formattedDate.getMonth() + 1).toString().padStart(2, '0'))
    const day = Number(formattedDate.getDate().toString().padStart(2, '0'))

    const result = `${month}월 ${day}일 ${ampm} ${hoursStr}:${minutes}`
    return result
  }

  return (
    <div>
      <div className={elementStyle}>
        <div className={contentStyle}>
          <span className={textStyle + ' underline decoration-2 decoration-solid decoration-yellow-400'}>{reply.name || reply.nickName}</span>
          <span className={textStyle + ' text-gray-400 text-xs'}>{formatTime(reply.time)}</span>
          <span className={textStyle + ' text-base'}>{reply.content + additionalText}</span>
        </div>
        {userInfo.name === reply.name && <span className={'text-sm text-red-400 h-fit'} onClick={deleteHandler}>삭제</span>}
      </div>
      <hr/>
    </div>
  )
}

export default ReplyElement