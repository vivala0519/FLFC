import RecordInput from '@/components/atoms/Text/RecordInput.jsx'
import RecordTypeText from '@/components/atoms/Text/RecordTypeText.jsx'
import ParticleRegisterButton from '@/components/atoms/ParticleRegisterButton.jsx'
import './RecordEntryForm.css'

// Presentational controls shared by the live WriteBox and the offline /test page.
const RecordEntryForm = ({ data, registerRef, registerHandler, handleKeyDown, handleBlur, disabled = false, buttonType = 'button' }) => {
  const { scorer, setScorer, assistant, setAssistant } = data

  return (
    <div ref={registerRef} className="record-entry-form">
      <div className="record-entry-form__fields">
        {[0, 1].map((index) => (
          <div key={index} className="record-entry-form__field">
            <RecordTypeText type={index === 0 ? 'GOAL' : 'ASSIST'} fontSize="12px" customStyle="" />
            <RecordInput
              type={index === 0 ? scorer : assistant}
              setData={index === 0 ? setScorer : setAssistant}
              ariaLabel={index === 0 ? '득점자' : '도움 선수'}
              handleKeyDown={handleKeyDown}
              handleBlur={handleBlur}
            />
          </div>
        ))}
      </div>
      <ParticleRegisterButton hasScorer={Boolean(scorer.trim())} onRegister={registerHandler} disabled={disabled} buttonType={buttonType} />
    </div>
  )
}

export default RecordEntryForm
