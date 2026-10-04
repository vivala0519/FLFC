import './FeverTimeBar.css'

const FeverTimeBar = (props) => {
  const { isFeverTime, clickHandler } = props
  const containerStyle = `${isFeverTime ? 'border-y-4 border-red-200 h-[45px] mt-0 mb-0 animate-pulse' : 'border-2 h-[35px] border-red-200 animate-pulse'} text-goal cursor-pointer text-lg flex flex-col justify-center items-center`


  return (
    <div className={containerStyle} onClick={clickHandler}>
      <span className={isFeverTime && 'animate-pulse'}>피버 타임 {!isFeverTime && 'On'}</span>
    </div>
  )
}
export default FeverTimeBar