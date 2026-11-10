const ReturnBadge = ({ className = '-top-1 left-full ml-1' }) => (
  <span
    aria-label="복귀 회원"
    className={`absolute whitespace-nowrap text-[9px] leading-none text-[#bb2649] font-dnf-bit -rotate-[17deg] animate-pulse ${className}`}
  >
    return
  </span>
)

export default ReturnBadge
