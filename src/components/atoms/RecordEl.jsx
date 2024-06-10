import RecordTypeText from "./Text/RecordTypeText.jsx";

const RecordEl = (props) => {
  const {type, text} = props
  const textStyle = `font-bold text-black ${type === 'GOAL' ? 'mr-5': ''}`
  return (
    <>
      <RecordTypeText type={type} fontSize={'13px'} />
      <span className={textStyle}>{text}</span>
    </>
  )
}

export default RecordEl