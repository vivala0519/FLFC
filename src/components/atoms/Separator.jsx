const Separator = ({fullWidth}) => {
  const separatorStyle = `border-1 border-green-600 ${fullWidth ? 'w-full' : 'w-1/2'} mb-4`

  return (
      <hr className={separatorStyle} />
  )
}

export default Separator