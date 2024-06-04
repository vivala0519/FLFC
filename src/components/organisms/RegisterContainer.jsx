import Swal from "sweetalert2";
import {getDatabase, ref, remove} from "firebase/database";

const RegisterContainer = (props) => {
  const { scrollContainerRef, open, dynamicHeight, showMVP, todayRecord, lastRecord, canRegister, thisYear, today } = props
  const containerStyle = `w-full overflow-auto flex flex-col gap-10 items-center bg-white p-2 `
  const dynamicStyle = `${open ? 'flex' : 'hidden'} ${showMVP ? 'opacity-10' : 'opacity-100'}`

  const deleteRecord = (index) => {
    Swal.fire({
      title: '삭제, Really?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    }).then((result) => {
      if (result.isConfirmed) {
        const db = getDatabase()
        const recordRef = ref(db, thisYear + '/' + today + '/' + todayRecord[index].id)
        remove(ref(db, thisYear + '/' + today + '/' + todayRecord[index].id))
        remove(recordRef).then(() => {
          console.log('Document successfully deleted!')
        })
          .catch((error) => {
            console.log(error)
          });
      }
    })
  }

  return (
    <div ref={scrollContainerRef} className={containerStyle + dynamicStyle} style={{height: open ? dynamicHeight : ''}}>
      {
        todayRecord?.map((record, index) =>
          <div
            className={`relative flex items-center gap-5 pt-1 in-desktop ${record.id === lastRecord ? 'bg-effect' : ''}`}
            key={index} style={{width: '80%'}}>
                            <span style={{
                              width: '30px',
                              fontSize: '12px',
                              fontFamily: 'Hahmlet',
                              color: 'grey'
                            }}>{record.time.split(':')[0] + ':' + record.time.split(':')[1]}</span>
            <div className='flex items-center pl-2 pr-2 border-b-green-600 border-b-2'>
                                  <span
                                      className='flex justify-center relative bottom-2 mr-0.5'
                                      style={{
                                        fontFamily: 'Giants-Inline',
                                        fontSize: '13px',
                                        color: '#bb2649'
                                      }}>GOAL</span>
              <span className='mr-5 font-bold text-black'>{record.goal}</span>
              {record.assist &&
                <>
                                        <span
                                            className='flex justify-center relative bottom-2 mr-0.5'
                                            style={{
                                              fontFamily: 'Giants-Inline',
                                              fontSize: '13px',
                                              color: '#eab308'
                                            }}>ASSIST</span>
                  <span className='font-bold text-black'>{record.assist}</span>
                </>}
            </div>
            {canRegister && <div className='absolute -right-1 top-1 cursor-pointer text-red-600'
                                 onClick={() => deleteRecord(index)}>X</div>}
          </div>
        )
      }
    </div>
  )
}

export default RegisterContainer