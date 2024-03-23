import {useEffect, useState} from 'react'
import styled from "styled-components"
import left from "@/assets/left.png"
import right from "@/assets/right.png"

function DataTable(props) {
    const {tap, tableData, analyzedData, page, setPage, month} = props
    const [sortedNames, setSortedNames] = useState([])
    const [sortedAbsenteeNames, setSortedAbsenteeNames] = useState([])

    useEffect(() => {
        // console.log('tableData.data', tableData.data)
        // console.log('analyzedData', analyzedData)
    }, [tableData]);

    useEffect(() => {
        setSortedNames(analyzedData?.members['active'].sort((a, b) => a.localeCompare(b)))
        setSortedAbsenteeNames(analyzedData?.members['inactive'].sort((a, b) => a.localeCompare(b)))
    }, []);

    const pageMoveHandler = (left) => {
        if (left && page > 0) {
            setPage(page - 1)
            return
        }
        if (!left && page < month.length - 1) {
            setPage(page + 1)
        }
    }

    return (
        <div>
            {tap !== '현황판' &&
                <MonthContainer className=''>
                    <LeftButton  onClick={() => pageMoveHandler(true)} />
                    <Month className=''>
                        {tableData.month}월
                    </Month>
                    <RightButton   onClick={() => pageMoveHandler(false)} />
                </MonthContainer>
            }
            <TableContainer>
                <Table>
                    {tap === '현황판' ?
                        <TableHeaderStat>
                            <div style={{minWidth: '75px', maxWidth: '75px'}}>이름</div>
                            <div>골</div>
                            <div>골순위</div>
                            <div>{`일평균\n득점`}</div>
                            <div>어시</div>
                            <div>어시순위</div>
                            <div>{`일평균\n어시`}</div>
                            <CustomMinWidthDiv $propsWidth='17%'>공격포인트</CustomMinWidthDiv>
                            <div>순위</div>
                            <div>출석</div>
                            <div>출석순위</div>
                            <CustomMinWidthDiv $propsWidth='26%' $propsMax='9.5%'>{`포인트 총합\n(출석, 어시, 골)`}</CustomMinWidthDiv>
                            <CustomMinWidthDiv $propsWidth='26%' $propsMax='9.5%'>포인트 총합 순위</CustomMinWidthDiv>
                        </TableHeaderStat>
                        :
                        <TableHeaderOther>
                            <div style={{width: '75px'}}>이름</div>
                            {
                                tableData.data?.map((data) => <span key={data.id}>{Number(data.id.slice(2, 4)) + '일'}</span>)
                            }
                            {<span>{`분기\n총합`}</span>}
                        </TableHeaderOther>
                    }
                    <StyledHR $tap={tap} />
                    <TableBody>
                        {/*실 출석 인원 먼저*/}
                        {
                            sortedNames?.map((name, index) =>
                                (<><TableRowStat key={index}>
                                    {tap === '현황판' ? <FirstColumn><div style={{width: '75px', borderRight: '1px solid #ccc'}}>{name}</div></FirstColumn> : <div style={{minWidth: '20%', flex: '1', borderRight: '1px solid #ccc'}}>{name}</div>}
                                    {/*골	골순위	일평균 득점	어시	어시순위	일평균 어시	공격포인트	순위	출석	출석순위	포인트 총합(출석,어시,골)	포인트 총합순위*/}
                                    {tap === '현황판' &&
                                        <>
                                            <span>{analyzedData.totalData.get(name)['골']}</span>
                                            <span>{analyzedData.totalData.get(name)['골순위']}</span>
                                            <span>{analyzedData.totalData.get(name)['일평균득점']}</span>
                                            <span>{analyzedData.totalData.get(name)['어시']}</span>
                                            <span>{analyzedData.totalData.get(name)['어시순위']}</span>
                                            <span>{analyzedData.totalData.get(name)['일평균어시']}</span>
                                            <CustomMinWidthSpan $propsWidth='17%'>{analyzedData.totalData.get(name)['공격포인트']}</CustomMinWidthSpan>
                                            <span>{analyzedData.totalData.get(name)['공격포인트순위']}</span>
                                            <span>{analyzedData.totalData.get(name)['출석']}</span>
                                            <span>{analyzedData.totalData.get(name)['출석순위']}</span>
                                            <CustomMinWidthSpan $propsWidth='26%' $propsMax='10%'>{analyzedData.totalData.get(name)['포인트총합']}</CustomMinWidthSpan>
                                            <CustomMinWidthSpan $propsWidth='26%' $propsMax='10%'>{analyzedData.totalData.get(name)['포인트총합순위']}</CustomMinWidthSpan>
                                        </>
                                    }
                                    {tap === '출석' && tableData.data.map((data, index) => (<span key={name + index}>{data.data[name] ? 'O' : '-'}</span>))}
                                    {tap === '골' && tableData.data.map((data, index) => (<span key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '-' : data.data[name][tap] : '-'}</span>))}
                                    {tap === '어시' && tableData.data.map((data, index) => (<span key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '-' : data.data[name][tap] : '-'}</span>))}
                                    {tap !== '현황판' && <span>{analyzedData.totalData.get(name)[tap]}</span>}
                                </TableRowStat>
                            <StyledHR $tap={tap} /></>))
                        }
                        {/*장기 미출석 인원*/}
                        {sortedAbsenteeNames?.map((name, index) =>
                            (<><TableRowOther key={index}>
                                {tap === '현황판' ? <FirstColumn><div style={{width: '75px'}}>{name}</div></FirstColumn> : <div style={{minWidth: '20%', flex: '1'}}>{name}</div>}
                                {
                                    tap === '출석' ? tableData.data.map((data, index) => (
                                            <span key={name + index}>{data.data[name] ? 'O' : ''}</span>))
                                        : tap === '골' ? tableData.data.map((data, index) => (<span
                                                key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '' : data.data[name][tap] : ''}</span>))
                                            : tableData.data.map((data, index) => (<span
                                                key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '' : data.data[name][tap] : ''}</span>))
                                }
                                <span className='flex items-center pre text-xs'></span>
                            </TableRowOther>
                            <StyledHR $tap={tap} /></>))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default DataTable

const MonthContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 30px;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    padding-top: 10px;
    padding-bottom: 10px;
    @media (max-width: 812px) {
        font-size: 15px;
    }
`

const LeftButton = styled.div`
    background: url(${left}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 15px;
        height: 15px;
    }
`

const Month = styled.div`
    position: relative;
    top: -1px;
`

const RightButton = styled.div`
    background: url(${right}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 15px;
        height: 15px;
    }
`

const TableContainer = styled.div`
    overflow-x: auto;
`

const Table = styled.div`
    display: flex;
    flex-direction: column;
`

const TableHeaderStat = styled.div`
    display: flex;
    align-items: center;
    //padding: 8px 16px;
    //width: fit-content;
    padding-bottom: 8px;
    justify-content: space-between;
    > div {
        flex: 1;
        min-width: 7%;
        max-width: 7%;
        height: 36px;
        display: flex;
        white-space: pre-line;
        border-right: 1px solid #ccc;
        justify-content: center;
        align-items: center;
        @media (max-width: 812px) {
            font-size: 12px;
            min-width: 14%;
        }
    }
`

const TableHeaderOther = styled.div`
    display: flex;
    align-items: center;
    //padding: 8px 16px;
    //width: fit-content;
    padding-bottom: 8px;
    //border-bottom: 1px solid #ccc;
    > div {
        flex: 1;
        min-width: 20%;
        font-size: 12px;
        white-space: pre-line;
        border-right: 1px solid #ccc;
    }
    > span {
        flex: 1;
        min-width: 13%;
        font-size: 12px;
        border-right: 1px solid #ccc;
    }
`

const TableBody = styled.div`
    display: flex;
    flex-direction: column;
`

const TableRowStat = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
    > span {
        flex: 1;
        min-width: 7%;
        border-right: 1px solid #ccc;
        //border-top: 1px solid #ccc;
        @media (max-width: 812px) {
            min-width: 14%;
        }
    }
`

const TableRowOther = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
    > span {
        flex: 1;
        min-width: 13%;
    }
`

const FirstColumn = styled.div`
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    @media (prefers-color-scheme: dark) {
        background: black;
    }
`

const CustomMinWidthSpan = styled.span`
    min-width: ${props => props.$propsMax} !important;
    @media (max-width: 812px) {
        min-width: ${props => props.$propsWidth} !important;
    }
`

const CustomMinWidthDiv = styled.div`
    flex: 1;
    min-width: 7%;
    max-width: ${props => props.$propsMax} !important;;
    white-space: pre-line;
    @media (max-width: 812px) {
        font-size: 12px;
        min-width: ${props => props.$propsWidth} !important;
    }   
`

const StyledHR = styled.hr`
    @media (max-width: 812px) {
        width: ${props => props.$tap === '현황판' && '215%'} !important;
    }
`