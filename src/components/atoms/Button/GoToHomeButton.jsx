import { Link } from 'react-router-dom'

const GoToHomeButton = () => {
  const homeStyle =
    'absolute top-6 left-7 bg-homeLight dark:bg-homeDark bg-[length:70%_70%] w-10 h-10 bg-no-repeat bg-center'
  const textStyle =
    'relative top-3 text-[10px] text-green-800 dark:text-yellow-500'

  return (
    <Link to="/">
      <div className={homeStyle}>
        <span className={textStyle}>Home</span>
      </div>
    </Link>
  )
}

export default GoToHomeButton
