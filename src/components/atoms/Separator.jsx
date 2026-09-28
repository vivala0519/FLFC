const Separator = ({fullWidth}) => {
  const separatorStyle = `border-b-2 border-double border-blue-600 ${fullWidth ? 'w-full' : 'w-[80%]'} mb-4`

  return (
      <hr className={separatorStyle} />
  )
}

export default Separator