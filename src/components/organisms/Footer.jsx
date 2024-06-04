const Footer = () => {
  const footerStyle = 'absolute flex flex-col gap-[5px] bottom-3 font-hahmlet font-normal text-[#5a5a5a] text-[12px] mobile:text-[8px]'

  return (
    <footer className={footerStyle}>
      <p>
        Developed by. Seungho Lee
      </p>
      <p>
        Copyright 2024 Seungho Lee. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer