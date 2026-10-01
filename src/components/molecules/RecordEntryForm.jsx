import { useEffect, useRef, useState } from 'react'
import RecordInput from '@/components/atoms/Text/RecordInput.jsx'
import RecordTypeText from '@/components/atoms/Text/RecordTypeText.jsx'
import ParticleRegisterButton from '@/components/atoms/ParticleRegisterButton.jsx'
import './RecordEntryForm.css'

// Presentational controls shared by the live WriteBox and the offline /test page.
const RecordEntryForm = ({ data, registerHandler, handleKeyDown, handleBlur, disabled = false, busy = false, buttonType = 'button', burstTargetRef }) => {
  const { scorer, setScorer, assistant, setAssistant } = data
  const [rolling, setRolling] = useState(false)
  const registering = useRef(false)
  const pendingRegister = useRef(null)
  const mounted = useRef(false)
  const submitting = rolling || busy

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const startRegistration = () => {
    if (registering.current || disabled || busy || !scorer.trim()) return
    registering.current = true
    pendingRegister.current = registerHandler
    setRolling(true)
  }

  const completeRoll = async () => {
    const register = pendingRegister.current
    pendingRegister.current = null
    if (!register) return

    try {
      await register()
    } finally {
      registering.current = false
      if (mounted.current) setRolling(false)
    }
  }

  return (
    <div className="record-entry-form" data-submitting={submitting} aria-busy={submitting}>
      <div className="record-entry-form__fields relative left-[40px]">
        {[0, 1].map((index) => (
          <div key={index} className="record-entry-form__field">
            <RecordTypeText type={index === 0 ? 'Goal :' : 'Assist :'} fontSize="16px" customStyle="" />
            <RecordInput
              type={index === 0 ? scorer : assistant}
              setData={index === 0 ? setScorer : setAssistant}
              ariaLabel={index === 0 ? '득점자' : '도움 선수'}
              handleKeyDown={handleKeyDown}
              handleBlur={handleBlur}
              disabled={disabled || submitting}
            />
          </div>
        ))}
      </div>
      <ParticleRegisterButton
        hasScorer={Boolean(scorer.trim())}
        onRegister={startRegistration}
        disabled={disabled || submitting}
        buttonType={buttonType}
        rolling={submitting}
        onRollComplete={completeRoll}
        burstTargetRef={burstTargetRef}
      />
      {submitting && <span className="sr-only" role="status">등록 중...</span>}
    </div>
  )
}

export default RecordEntryForm
