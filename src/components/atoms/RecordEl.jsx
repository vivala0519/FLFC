import RecordTypeText from "./Text/RecordTypeText.jsx";

const RecordEl = (props) => {
    const { type, text, isEditing, onChange } = props
    const textStyle = `relative left-6 font-bold text-black dark:text-gray-100 text-[20px]`
    const inputStyle = `font-bold text-black dark:text-gray-100 text-[20px] bg-transparent border-b-2 border-blue-300 focus:outline-none w-[50px] ml-1 text-center`

    return (
        <div className={'flex flex-row items-center'}>
            <RecordTypeText type={type} fontSize={'12px'} customStyle={`absolute -top-[5px] opacity-70 ` + (isEditing && ' relative left-[8px]')}/>

            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={onChange}
                    className={inputStyle}
                    autoFocus={type === 'Goal'}
                />
            ) : (
                <span className={textStyle}>{text}</span>
            )}
        </div>
    )
}

export default RecordEl