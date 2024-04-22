import {useEffect, useState} from "react"
import {getDatabase, ref, onValue, update, set} from 'firebase/database'
import {db} from "../../firebase.js"
import Swal from "sweetalert2"
import styled from 'styled-components'
import {doc, setDoc} from "firebase/firestore";
import { uid } from "uid"

const AdminPage = (props) => {
    const { recordData, weeklyTeamData } = props
    const thisYear = '2024'
    const currentTime = new Date()
    const month = (currentTime.getMonth() + 1).toString().padStart(2, '0')
    const date = currentTime.getDate().toString().padStart(2, '0')
    const today = month + date
    const players = ['이승호', '임준휘', '우장식', '이원효', '김동휘', '임희재', '김규진', '임건휘', '한상태', '노태훈', '박근한', '윤희철', '정우진', '홍원진', '김남구', '김민관', '양대열', '윤영진', '임종우', '황정민', '손지원', '방승진', '전희종', '황철민', '선민조', '최봉호', '최수혁', '김대건', '김동주', '김병일', '김성록', '박남호', '선우용', '안용현', '윤준석', '이재진', '이진헌', '장성민', '전의준', '진장용', '하민수', '황은집']

    const [showTable, setShowTable] = useState(true)
    const [password, setPassword] = useState('')
    const [todayRecordObj, setTodayRecordObj] = useState({})
    const [todayRecord, setTodayRecord] = useState([])
    const [resolvedList, setResolvedList] = useState([])
    const [requestList, setRequestList] = useState([])
    const [writtenData, setWrittenData] = useState([])
    const [showRecordInput, setShowRecordInput] = useState(false)
    const [scorer, setScorer] = useState('')
    const [assistant, setAssistant] = useState('')

    const passwordCheck = async () => {
        const {value: password} = await Swal.fire({
            title: '비밀번호 입력해주세요',
            input: 'password',
            inputPlaceholder: '********',
        })
        setPassword(password)
    }
    useEffect(() => {
        passwordCheck()
    }, []);

    useEffect(() => {
        if (password === '0413') {
            setShowTable(true)
        } else {
            setPassword(null)
            passwordCheck()
        }
    }, [password])

    useEffect(() => {
        if (showTable) {
            const db = getDatabase()

            const todayRef = ref(db, thisYear + '/')
            onValue(todayRef, (snapshot) => {
                const data = snapshot.val()
                setTodayRecordObj(data)
            })
            const data = recordData?.find(obj => obj.id === today)
            if (data?.data) {
                setWrittenData(data.data)
            }
        }
    }, [showTable]);

    const parseTimeString = (record) => {
        const [hours, minutes, seconds] = record.split(':')
        return new Date(0, 0, 0, hours, minutes, seconds)
    }

    useEffect(() => {
        const isData = todayRecordObj[today]
        if (isData) {
            const recordArray = Object.values(isData)
            const sortedRecordArray = recordArray.sort((a, b) => {
                const timeA = parseTimeString(a.time)
                const timeB = parseTimeString(b.time)

                return timeA - timeB
            });
            setTodayRecord(sortedRecordArray)
        }
        const isRequestList = todayRecordObj[today + '_request']
        if (isRequestList) {
            const requestList = Object.values(isRequestList)
            const sortedRequestArray = requestList.sort((a, b) => {
                const timeA = parseTimeString(a.time)
                const timeB = parseTimeString(b.time)

                return timeA - timeB
            });
            setRequestList(sortedRequestArray.filter(request => request.status === 'processing'))
            setResolvedList(sortedRequestArray.filter(request => request.status === 'resolved'))
        }
    }, [todayRecordObj]);

    const resolveHandler = (id) => {
        const updateData = requestList.find(request => request.id === id)
        updateData.status = 'resolved'

        const db = getDatabase()
        update(ref(db, thisYear + '/' + today + '_request/' + id), updateData).then(()=> {
            console.log('Document successfully updated!')
        }).catch((error) => {
            console.error('Error updating document: ', error)
        })
    }

    const goalInputChangeHandler = (index, newGoal) => {
        setTodayRecord(prevRecords => {
            const newRecords = [...prevRecords]
            newRecords[index] = {...newRecords[index], goal: newGoal}
            return newRecords
        });
    }

    const assistInputChangeHandler = (index, newAssist) => {
        setTodayRecord(prevRecords => {
            const newRecords = [...prevRecords]
            newRecords[index] = {...newRecords[index], assist: newAssist}
            return newRecords
        });
    }

    const formatRecordByName = (record) => {
        const stats = {}
        if (weeklyTeamData?.data && weeklyTeamData?.id === today) {
            const data = weeklyTeamData.data
            const thisWeekMembers = data[1].concat(data[2], data[3])
            thisWeekMembers.forEach(member => {
                players.forEach(player => {
                    if (member && player.includes(member)) {
                        stats[player] = {'출석': true, '골': 0, '어시': 0}
                    }
                })
            })

            record.forEach(item => {
                const { assist, goal } = item

                if (goal !== "") {
                    players.forEach(player => {
                        if (player.includes(goal) && stats[player]) {
                            stats[player]['골']++
                        }
                    })
                }

                if (assist !== "") {
                    players.forEach(player => {
                        if (player.includes(assist) && stats[player]) {
                            stats[player]['어시']++
                        }
                    })
                }
            });
            return stats
        }
    }
    function compareObjects(objA, objB) {
        const keysA = Object.keys(objA)
        const keysB = Object.keys(objB)

        if (keysA.length !== keysB.length) {
            return false
        }
        for (let key of keysA) {
            if (objA[key]['출석'] !== objB[key]['출석'] ||
                objA[key]['골'] !== objB[key]['골'] ||
                objA[key]['어시'] !== objB[key]['어시']) {
                return false
            }
        }
        return true
    }
    const addRecordHandler = () => {
        const rtdb = getDatabase()
        const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
        const id = uid()

        if (scorer.trim()) {
            const record = {
                id: id,
                time: time,
                goal: scorer.trim(),
                assist: assistant.trim()
            }
            set(ref(rtdb, thisYear + '/' + today + '/' + id), record);
            set(ref(rtdb, thisYear + '/' + today + '_backup' + '/' + id), record);

            const copiedRecord = [...todayRecord]
            copiedRecord.push(record)
            const stats = formatRecordByName(copiedRecord)
            if (stats) {
                const registerRecord = async () => {
                    const docRef = doc(db, thisYear, today)
                    await setDoc(docRef, stats)
                    console.log("Document written with ID: ", docRef.id);
                }
                if (!compareObjects(stats, writtenData)) {
                    registerRecord()
                }
            }
        }
        setScorer('')
        setAssistant('')
        setShowRecordInput(false)
    }
    const updateRecordHandler = (id) => {
        const updateRecord = todayRecord.find(record => record.id === id)
        const rtdb = getDatabase()
        update(ref(rtdb, thisYear + '/' + today + '/' + id), updateRecord).then(() => {
            console.log('Document successfully updated!')

            const stats = formatRecordByName(todayRecord)
            if (stats) {
                const registerRecord = async () => {
                    const docRef = doc(db, thisYear, today)
                    await setDoc(docRef, stats)
                    console.log("Document written with ID: ", docRef.id);
                }
                if (!compareObjects(stats, writtenData)) {
                    registerRecord()
                }
            }
        }).catch((error) => {
            console.error('Error updating document: ', error)
        })
    }

    const scorerHandler = (e) => {
        setScorer(e.target.value)
    }

    const assistantHandler = (e) => {
        setAssistant(e.target.value)
    }

  return (
    <div>
        {showTable &&
            <div>
                <span>요청 사항</span>
                <div className='border-2 border-amber-200 mt-2 h-32 overflow-y-auto p-1 flex flex-col gap-2'>
                    {resolvedList.map((request, index) => {
                        return (
                            <div key={index}>
                                <div className='flex items-center'>
                                    <div className='mr-2'>
                                        <Complete/>
                                    </div>
                                    <div className='flex flex-row justify-between items-center gap-3 w-full'>
                                        <span className='text-xs flex items-center h-full'
                                              style={{textAlign: 'left', width: '270px'}}>{request.text}</span>
                                            <div className='w-5'/>
                                    </div>
                                </div>
                                <hr className='border-1 border-gray-200'/>
                            </div>
                        )
                    })}
                    {requestList.map((request, index) => {
                        return (
                            <div key={index}>
                                <div className='flex items-center'>
                                    <div className='mr-2'>
                                        {request.status === 'processing' ? <Processing/> : <Complete/>}
                                    </div>
                                    <div className='flex flex-row justify-between items-center gap-3 w-full'>
                                        <span className='text-xs flex items-center h-full'
                                              style={{textAlign: 'left', width: '270px'}}>{request.text}</span>
                                        <div className='border-green-200 border-2 text-xs w-8 h-5 flex justify-center items-center cursor-pointer' onClick={() => resolveHandler(request.id)}>완료</div>
                                    </div>
                                </div>
                                <hr className='border-1 border-gray-200'/>
                            </div>
                        )
                    })}
                </div>
                <div className={`flex items-center justify-center mt-5 ${!showRecordInput ? 'pl-12' : 'pl-0'}`}>
                    <span>오늘의 기록</span>
                    {showRecordInput &&
                        <div className='flex ml-4 items-center'>
                            <span className='w-8 text-xs flex items-center justify-center h-full'>골 :</span>
                            <input className='w-12 text-xs border-2 border-amber-100' style={{textAlign: 'center'}} onChange={scorerHandler} />
                            <span className='w-8 text-xs flex items-center justify-center h-full'>어시 :</span>
                            <input className='w-12 text-xs border-2 border-amber-100' style={{textAlign: 'center'}} onChange={assistantHandler}/>
                        </div>
                    }
                    {!showRecordInput ?
                        <div className='relative left-16 text-xs border-2 border-indigo-100 cursor-pointer'
                             onClick={() => setShowRecordInput(true)}>기록 추가하기</div>
                        :
                        <div className='ml-2 text-xs border-2 border-indigo-100 cursor-pointer'
                             onClick={() => addRecordHandler()}>추가</div>
                    }
                </div>
                <RecordBox className='border-2 border-amber-200 mt-2 overflow-y-auto p-1'>
                    <div>
                        {todayRecord.map((record, index) => {
                            return (
                                <div key={index}>
                                    <div className='flex items-center mb-1 border-b-2 border-b-gray-200 h-10'>
                                        <div className='flex flex-row justify-between items-center gap-3 w-full'>
                                            <span className='text-xs'>{record.time}</span>
                                            <div className='border-r-2 border-r-indigo-300 h-4'></div>
                                            <div className='flex'>
                                                <span className='w-6 text-xs flex items-center justify-center h-full'>골 :</span>
                                                <input className='w-12 text-xs border-2 border-amber-100' style={{textAlign: 'center'}} value={record.goal} onChange={e => goalInputChangeHandler(index, e.target.value)} />
                                            </div>
                                            <div className='border-r-2 border-r-indigo-300 h-4'></div>
                                            <div className='flex'>
                                                <span className='w-10 text-xs flex items-center  justify-center h-full'>어시 : </span>
                                                <input className='w-12 text-xs border-2 border-amber-100' style={{textAlign: 'center'}} value={record.assist} onChange={e => assistInputChangeHandler(index, e.target.value)} />
                                            </div>
                                            <div className='border-r-2 border-r-indigo-300 h-4'></div>
                                            <div className='text-xs flex items-center justify-center h-full w-12 border-2 border-indigo-100' onClick={() => updateRecordHandler(record.id)}>수정</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </RecordBox>
            </div>
        }

    </div>
  )
}

export default AdminPage

const Processing = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid red;
    background-color: red;
`

const Complete = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid green;
    background-color: green;
`

const RecordBox = styled.div`
    height: 70vh;
`