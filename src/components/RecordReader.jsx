import {useEffect, useState} from 'react'

function ReacordReader() {
  const [text, setText] = useState('')
  // '[박근한] [오전 8:19] 2R 14분\n' +
  // '골 : 대열 원효\n' +
  // '어시 : 원효 남구\n' +
  // '[양대열] [오전 8:37] 4R 31\n' +
  // '골: 준휘 준휘\n' +
  // '어시: 건휘 규진\n' +
  // '[손지원] [오전 8:51] 6R\n' +
  // '골: 근한 동휘\n' +
  // '어시: 승호\n' +
  // '[박근한] [오전 8:58] 7R  54\n' +
  // '골: 민관 태훈 동휘\n' +
  // '어시: 용병 규진 용병\n' +
  // '[손지원] [오전 9:04] 8R\n' +
  // '골: 근한 용병\n' +
  // '어시:용병 근한\n' +
  // '[손지원] [오전 9:11] 삭제된 메시지입니다.\n' +
  // '[손지원] [오전 9:11] 9R\n' +
  // '골: 승호 승호\n' +
  // '어시:근한 동휘\n' +
  // '[손지원] [오전 9:18] 10R\n' +
  // '골:민관 원효 원효\n' +
  // '어시:근한 장식 원진\n' +
  // '[박근한] [오전 9:23] 11R  21\n' +
  // '골: 준휘 장식 원효\n' +
  // '어시: 건휘 원효 희종\n' +
  // '[손지원] [오전 9:28] 12R\n' +
  // '골:희재 승호\n' +
  // '어시:근한 희재\n' +
  // '[박근한] [오전 9:36] 13R  31\n' +
  // '골: 규진 규진\n' +
  // '어시: 지원 준휘\n' +
  // '[박근한] [오전 9:37] 삭제된 메시지입니다.\n' +
  // '[박근한] [오전 9:43] 14R  38\n' +
  // '골: 대열 건휘 준휘\n' +
  // '어시: 원효 태훈 태훈\n' +
  // '[임희재] [오전 9:53] 15R  \n' +
  // '골: 승호 지원 승호\n' +
  // '어시: 건휘 근한\n' +
  // '[임희재] [오전 10:11] 16R \n' +
  // '골 : \n' +
  // '어시 : \n'
  const [lineArr, setLineArr] = useState([])
  // const [goal, setGoal] = useState([])
  // const [assist, setAssist] = useState([])

  const handleReadClick = () => {
    setLineArr(text.split('\n').map(line => line.trim()))
  }

  useEffect(() => {
    if (lineArr.length > 0) {
      // const goalReport = lineArr.filter(line => line.includes('골')).map(line => (line.split(':')[1].trim().split(' ')))
      const goalLines = lineArr.filter(line => line.includes('골'))
      const goalReport = []
      goalLines.forEach(line => {
        const splitedLine = line.split(':')[1].trim()
        if (splitedLine) {
          splitedLine.split(' ').forEach(el => goalReport.push(el))
        }
      })
      const assistLines = lineArr.filter(line => line.includes('어시'))
      const assistReport = []
      assistLines.forEach(line => {
        const splitedLine = line.split(':')[1].trim()
        if (splitedLine) {
          splitedLine.split(' ').forEach(el => assistReport.push(el))
        }
      })
      const goalReportObject = goalReport.reduce((acc, name) => {
        if (name !== '용병') {
          acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
      }, {});
      const assistReportObject = assistReport.reduce((acc, name) => {
        if (name !== '용병') {
          acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
      }, {});
      console.log(goalReportObject, assistReportObject)
    }
  }, [lineArr]);

  return (
      <div className='flex flex-col'>
        <textarea value={text} onChange={(event) => setText(event.target.value)} style={{width: '1000px', height: '700px', textAlign: 'center'}} />
        <button className='font-bold text-3xl' onClick={handleReadClick}>read</button>
      </div>
  )
}

export default ReacordReader
