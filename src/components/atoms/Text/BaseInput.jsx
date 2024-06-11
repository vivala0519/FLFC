const BaseInput = (props) => {
  const {propsValue, changeHandler} = props
  const placeholderText = 'ex) O시 O분 골 OO -> OO 로 수정 요청합니다~'
  const inputStyle = 'w-10/12 border-2 border-b-0 pl-1'

  return (
    <input
      className={inputStyle}
      placeholder={placeholderText}
      value={propsValue}
      onChange={(event) => changeHandler(event.target.value)}
    />
  )
}

export default BaseInput