import Swal from 'sweetalert2'
import {getDatabase, ref, remove} from 'firebase/database'
import RecordRow from '@/components/molecules/RecordRow.jsx'

const RecordContainer = (props) => {
  const { scrollContainerRef, open, dynamicHeight, showMVP, todayRecord, lastRecord, canRegister, thisYear, today } = props
  const containerStyle = `w-[96%] overflow-auto flex flex-col gap-10 items-center bg-white p-2 border border-transparent shadow-custom `
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
      {todayRecord?.map((record, index) =>
        <RecordRow
          key={index}
          index={index}
          effect={record.id === lastRecord}
          record={record}
          useDelete={canRegister}
          deleteRecord={deleteRecord}
        />
      )}
    </div>
  )
}

export default RecordContainer