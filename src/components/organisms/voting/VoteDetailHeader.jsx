import LeftButton from '@/components/atoms/Button/LeftButton.jsx'

const VoteDetailHeader = (props) => {
  const {backHandler} = props

  // style
  const headerStyle = 'flex items-center justify-between w-full pl-4 pr-4 absolute top-4'
  const titleStyle = 'text-lg'
  const fakeDivStyle = 'w-[30px] h-[30px]'

  return (
    <div className={headerStyle}>
      <LeftButton show={true} clickHandler={backHandler} />
      <span className={titleStyle}>투표 현황</span>
      <div className={fakeDivStyle} />
    </div>
  )
}

export default VoteDetailHeader