import FootBallRadio from '@/components/atoms/FootBallRadio.jsx'

const VoteItem = (props) => {
  const {
    text,
    type,
    checked,
    totalItemCount,
    index,
    setSelectedIndex,
    editMode,
    endVote,
  } = props

  // style
  const itemStyle = 'flex items-center justify-between w-[70%]'
  const leftStyle = 'flex gap-1 items-center'

  const clickHandler = (index) => {
    if (editMode && !endVote) {
      checked ? setSelectedIndex(-1) : setSelectedIndex(index)
    }
  }

  return (
    <div className={itemStyle}>
      <div className={leftStyle} onClick={() => clickHandler(index)}>
        {(editMode || checked) && (!endVote || checked) && (
          <FootBallRadio type={type} checked={checked} />
        )}
        <span className="w-[80px] text-left">{text}</span>
      </div>
      <span>{totalItemCount}</span>
    </div>
  )
}

export default VoteItem
