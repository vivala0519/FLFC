const NewBadge = ({ className = '-top-1 left-full ml-1', label = '새 항목' }) => (
  <span
    aria-label={label}
    className={`absolute whitespace-nowrap text-[9px] leading-none text-[#bb2649] font-dnf-bit -rotate-[17deg] animate-pulse ${className}`}
  >
    New
  </span>
)

export default NewBadge
