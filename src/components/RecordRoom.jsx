import {useEffect, useState} from 'react'

function RecordRoom(props) {
    const {data} = props
    const [tap, setTap] = useState(0)
    const tapName = ['현황판', '출석', '골', '어시']
    const [month, setMonth] = useState([])

    useEffect(() => {
        console.log(data)
        const monthSet = new Set()
        data?.forEach(doc => {
            monthSet.add(Number(doc.id.slice(0, 2)))
        })
        setMonth([...monthSet])
    }, [])

    useEffect(() => {
        console.log(month)
    }, [month])

    return (
      <div className='w-full'>
            <div
              className='flex flex-row justify-around w-full mb-5 p-2' style={{ fontFamily: 'Giants-Inline'}}>
              {tapName.map((tap, index) => <div className='border-solid border-0 border-b-2 border-indigo-600 cursor-pointer text-sm' key={index} onClick={() => setTap(index)}>{tap}</div>)}
          </div>
          <div className='w-full'>
              {/*{tap === 0 ? <div>현황판</div> : tap === 1 ? <div>출석</div> : tap === 2 ? <div>골</div> : <div>어시</div>}*/}
              <table className='overscroll-x-auto' style={{width: '340px'}}>
                  <thead>
                      <tr>
                          {month?.map((m, index) => (
                              <th key={index} style={{width: '330px'}}>{m}</th>
                          ))}
                          {/*{calendarData.map((date, index) => (*/}
                          {/*    <th key={index}>{date.getDate()}</th>*/}
                          {/*))}*/}
                      </tr>
                  </thead>
                  <tbody>
                  {/* 이 부분에 나머지 테이블 내용을 추가할 수 있습니다. */}
                  </tbody>
              </table>
          </div>
      </div>
    )
}

export default RecordRoom