const VoterList = (props) => {
  const { list, useUnderLine } = props
  const listStyle = 'w-full mb-4 pl-4 grid grid-cols-3 pr-4'

  return (
    <div className={listStyle}>
      {list.map((voter, index) => {
        return (
          <div key={index} className=''>
            <span className={`text-center text-[20px] ${useUnderLine && 'underline decoration-2 decoration-solid decoration-yellow-400'}`}>{voter.name || voter.nickName}</span>
          </div>
        )
      })}
    </div>
  )
}

export default VoterList