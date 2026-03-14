import RecordTypeText from "./Text/RecordTypeText.jsx";

const RecordEl = (props) => {
    const { type, text, isEditing, onChange } = props
    const textStyle = `font-bold text-black dark:text-gray-100 text-[20px]`
    const inputStyle = `font-bold text-black dark:text-gray-100 text-[20px] bg-transparent border-b-2 border-blue-300 focus:outline-none w-[50px] ml-1`

    return (
        <div className={'flex flex-row items-center'}>
            <RecordTypeText type={type} fontSize={'20px'} customStyle={`relative top-[-5px]`} sliceText={1} />

            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={onChange}
                    className={inputStyle}
                    autoFocus={type === 'GOAL'}
                />
            ) : (
                <span className={textStyle}>{text}</span>
            )}
        </div>
    )
}

export default RecordEl