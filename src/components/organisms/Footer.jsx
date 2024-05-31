import styled from 'styled-components'

const Footer = () => {
  return (
    <footer className='absolute bottom-3'>
      <CopyRight>
        Developed by. Seungho Lee
      </CopyRight>
      <CopyRight>
        Copyright 2024 Seungho Lee. All rights reserved.
      </CopyRight>
    </footer>
  )
}

export default Footer;

const CopyRight = styled.span`
  font-size: 12px;
  font-family: "Hahmlet", serif;
  font-style: normal;
  font-weight: 400;
  color: #5a5a5a;
  display: flex;
  justify-content: center;
  margin-top: 5px;
  width: 100%;
  @media (max-width: 821px) {
      font-size: 8px;
  };
`