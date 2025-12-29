import './FeverTimeBar.css'

const FeverTimeBar = (props) => {
  const { isFeverTime, clickHandler } = props
  const containerStyle = `${isFeverTime ? 'box2 h-[45px] mt-0 mb-0' : 'border-2 h-[35px] border-red-200 animate-pulse'} text-goal cursor-pointer text-lg flex flex-col justify-center items-center`


  return (
    <div className={containerStyle} onClick={clickHandler}>
      <span className={isFeverTime && 'animate-pulse'}>피버 타임 {!isFeverTime && 'Off'}</span>
    </div>
  )
}
export default FeverTimeBar