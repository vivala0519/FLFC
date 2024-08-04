import styled from 'styled-components'
import write from '@/assets/write.png'

const RegisterButton = (props) => {
  const { text, clickHandler, active, customStyle } = props
  const buttonStyle = `flex relative bottom-2 mt-5 focus:outline-none focus:ring-0 focus:border-transparent active:outline-none active:ring-0 active:border-transparent ${active ? 'underline-border bg-gray-50 rounded-sm' : 'bg-gray-200 rounded-md'}`
  const buttonTextStyle = `${active ? 'text-black' : 'text-gray-500'}`

  return (
    <button className={ customStyle + buttonStyle} onClick={clickHandler}>
      <span className={buttonTextStyle}>
        {text}
      </span>
      <Write />
    </button>
  )
}

export default RegisterButton

const Write = styled.div`
  background: url(${write}) no-repeat center center;
  background-size: 100% 100%;
  width: 20px;
  height: 20px;
  position: relative;
  top: 3px;
  left: 7px;
`