import RecordTypeText from "./Text/RecordTypeText.jsx";

const RecordEl = (props) => {
  const {type, text} = props
  const textStyle = `font-bold text-black text-[20px]`

  return (
    <div className={'flex flex-row'}>
      <RecordTypeText type={type} fontSize={'20px'} customStyle={`relative top-[-5px]`} sliceText={1} />
      <span className={textStyle}>{text}</span>
    </div>
  )
}

export default RecordEl