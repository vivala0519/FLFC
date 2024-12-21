import VoterList from '@/components/molecules/voting/VoterList.jsx'

const VoterTap = (props) => {
  const { tap, statistics } = props

  // style
  const tapStyle = 'w-full h-full'
  const tapContentDiv = 'w-full pt-7 h-full overflow-y-auto'
  const listTitle = 'w-full text-left mb-2 pl-4'

  return (
      <div className={tapStyle}>
        {
          tap === 0 &&
            <div className={tapContentDiv}>
              <div className={listTitle}>월회비 참석 : {statistics.monthAttend.length}명</div>
              <VoterList list={statistics.monthAttend} useUnderLine={true} />
              <div className={listTitle}>주회비 참석 : {statistics.weekAttend.length}명</div>
              <VoterList list={statistics.weekAttend} useUnderLine={true} />
              <div className={listTitle}>불참 : {statistics.absent.length}명</div>
              <VoterList list={statistics.absent} useUnderLine={true} />
              <div className={listTitle}>보류 : {statistics.keeping.length}명</div>
              <VoterList list={statistics.keeping} useUnderLine={true} />
            </div>
        }
        {
          tap === 1 &&
            <div className='h-[calc(100%-140px)] overflow-y-auto'>
              {/*<div className={listTitle}>{statistics.nonVoter.length}명</div>*/}
              <VoterList list={statistics.nonVoter} />
            </div>
        }
      </div>
  )
}

export default VoterTap