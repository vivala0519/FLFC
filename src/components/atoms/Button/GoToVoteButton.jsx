import { Link } from 'react-router-dom'

const GoToVoteButton = () => {
  const buttonStyle =
    'flex flex-col absolute top-6 right-8 dark:text-yellow-400 text-xs text-gray-700 cursor-pointer '
  const arrowStyle = 'animate-flipX absolute -right-4 top-0'

  const clickHandler = () => {}

  return (
    <Link to="/vote">
      <div className={buttonStyle} onClick={clickHandler}>
        <span>참여 투표</span>
        <span className={arrowStyle}>▶</span>
      </div>
    </Link>
  )
}

export default GoToVoteButton
