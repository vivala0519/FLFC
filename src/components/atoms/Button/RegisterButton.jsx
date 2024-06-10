import styled from 'styled-components'
import write from '@/assets/write.png'

const RegisterButton = (props) => {
  const { text, clickHandler } = props
  const buttonStyle = 'flex relative bottom-2 mt-5 underline-border bg-gray-50'
  return (
    <button className={buttonStyle} onClick={clickHandler}>
      <span className='text-black'>
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