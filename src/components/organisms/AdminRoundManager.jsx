import { useEffect, useMemo, useRef, useState } from 'react'
import { uid } from 'uid'
import getTimes from '@/hooks/getTimes.js'
import getRecords from '@/hooks/getRecords.js'
import getMembers from '@/hooks/getMembers.js'
import {
  createAdminRound, createAdminRoundDrafts, getAdminMatchContext, getAdminRoundScores, validateAdminGoal,
} from '@/apis/adminRoundDraft.js'
import { getAdminRoundVersion } from '@/apis/adminRoundMutation.js'
import { adminRoundWrites } from '@/apis/adminRoundWrites.js'
import ballImage from '@/assets/futsal-ball4.png'
import darkBallImage from '@/assets/futsal-ball-yellow.png'
import './AdminRoundManager.css'

const TextButton = ({ label, children, className = '', ...props }) => (
  <button type="button" className={`admin-text-button ${className}`} aria-label={label} title={label} {...props}>
    {children}
  </button>
)

function Confirmation({ value, onClose, canEdit, saving, error }) {
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current?.showModal() }, [])
  return (
    <dialog ref={dialogRef} className="admin-confirm-dialog" onCancel={(event) => {
      if (saving) event.preventDefault()
      else onClose()
    }} onClose={onClose}
      aria-labelledby="admin-confirm-title" onClick={(event) => {
        if (saving || event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}>
      <h3 id="admin-confirm-title">{value.title}</h3>
      <p>{value.message}</p>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-form-actions">
        <button type="button" className="admin-command" disabled={saving} onClick={onClose}>취소</button>
        <button type="button" className={`admin-command ${value.danger ? 'is-danger' : 'is-primary'}`}
          disabled={!canEdit || saving} onClick={async () => { if (await value.action()) onClose() }}>
          {saving ? '저장중' : value.label}
        </button>
      </div>
    </dialog>
  )
}

function EditorForm({ title, onSubmit, onCancel, canEdit, saving, error, children }) {
  return <form className="admin-record-form" onSubmit={onSubmit}>
    <div className="admin-form-heading"><h4>{title}</h4>
    </div>
    <fieldset disabled={!canEdit} className="admin-field-grid">{children}</fieldset>
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <div className="admin-form-actions">
      <button type="button" className="admin-command" disabled={saving} onClick={onCancel}>취소</button>
      <button type="submit" className="admin-command is-primary" disabled={!canEdit || saving}>{saving ? '저장중' : '저장'}</button>
    </div>
  </form>
}

export function AdminRoundEditor({ source, seed: rounds, teams, members, context, loading, onSave, onRetry }) {
  const [goalForm, setGoalForm] = useState(null)
  const [roundForm, setRoundForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [statsPending, setStatsPending] = useState(false)
  const savingRef = useRef(false)
  const form = goalForm || roundForm
  const hasIncoming = Boolean(form && getAdminRoundVersion(form.expected)
    !== getAdminRoundVersion(roundForm?.isNew ? source || {} : source?.[form.roundId]))
  const canEdit = context.canEdit && !loading && !statsPending
  const hasForm = Boolean(goalForm || roundForm)
  const controlsLocked = hasForm || saving || Boolean(confirmation)
  const playingRound = rounds.find((round) => round.result === 'playing')
  const teamOptions = [...new Set(['1', '2', '3', ...Object.keys(teams).filter((team) => Array.isArray(teams[team])
    && teams[team].some((name) => typeof name === 'string' && name.trim())), ...rounds.flatMap((round) => round.teams)])].sort()
  const playerOptions = [...new Set([...members, ...Object.values(teams).flat(),
    ...rounds.flatMap((round) => round.goals.flatMap((goal) => [goal.goal, goal.assist]))])]
    .filter((name) => typeof name === 'string' && name.trim()).sort((a, b) => a.localeCompare(b, 'ko'))

  const closeForms = () => { setGoalForm(null); setRoundForm(null); setFormError('') }
  const persist = async (operation) => {
    if (!canEdit || savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    setFormError('')
    try {
      const result = await onSave(operation)
      closeForms()
      setStatsPending(result.statsPending)
      setNotice(result.statsPending ? result.message : '기록과 현황판 집계를 저장했습니다.')
      return true
    } catch (error) {
      setFormError(error.message || '기록 저장에 실패했습니다.')
      return false
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  const openGoalForm = (round, goal) => {
    if (!canEdit || hasForm) return
    setFormError('')
    setGoalForm({ roundId: round.id, expected: source[round.id], isNew: !goal, draft: goal ? { ...goal } : {
      id: uid(), time: context.timeLabel,
      goal: '', assist: '', team: round.teams[0] || '', fever: false,
    } })
    setNotice('')
  }
  const applyGoal = (event) => {
    event.preventDefault()
    const round = rounds.find((item) => item.id === goalForm.roundId)
    if (!canEdit || !round) return
    const draft = { ...goalForm.draft, time: new FormData(event.currentTarget).get('time') }
    const error = validateAdminGoal(draft, round)
    if (error) { setFormError(error); return }
    const goal = { ...draft, goal: draft.goal.trim(), assist: draft.assist.trim() }
    persist({ type: 'saveGoal', roundId: round.id, expected: goalForm.expected, isNew: goalForm.isNew, draft: goal })
  }
  const applyRound = (event) => {
    event.preventDefault()
    if (!canEdit) return
    const draft = { ...roundForm.draft, time: new FormData(event.currentTarget).get('time') }
    if (!draft.teams[0] || !draft.teams[1] || draft.teams[0] === draft.teams[1]) {
      setFormError('서로 다른 두 팀을 선택해주세요.'); return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(draft.time)) {
      setFormError('라운드 시작 시간을 확인해주세요.'); return
    }
    persist({ type: roundForm.isNew ? 'addRound' : 'saveRound', roundId: draft.id, expected: roundForm.expected, draft })
  }
  const updateRoundTeam = (index, value) => {
    const nextTeams = [...roundForm.draft.teams]
    nextTeams[index] = value
    const result = roundForm.draft.result === roundForm.draft.teams[index] ? value : roundForm.draft.result
    setRoundForm({ ...roundForm, draft: { ...roundForm.draft, teams: nextTeams, result } })
  }
  const confirmDelete = (round, goal) => {
    if (!canEdit || hasForm) return
    setFormError('')
    setNotice('')
    setConfirmation({ title: goal ? '기록을 삭제할까요?' : `${round.index + 1}라운드를 삭제할까요?`,
      message: goal ? `${goal.time.slice(0, 5)} · ${goal.goal}${goal.assist ? ` / ${goal.assist}` : ''}` : '이 라운드의 골·어시 기록도 함께 삭제됩니다.',
      label: '삭제', danger: true,
      action: () => persist({ type: goal ? 'deleteGoal' : 'deleteRound', roundId: round.id,
        expected: source[round.id], goalId: goal?.id }) })
  }
  const renderGoalForm = (round) => <EditorForm title={goalForm.isNew ? '골·어시 추가' : '골·어시 수정'}
    onSubmit={applyGoal} onCancel={closeForms} canEdit={canEdit && !saving && !hasIncoming} saving={saving} error={formError}>
    <label>기록 시간<input name="time" type="time" step="1" value={goalForm.draft.time} required
      onChange={(event) => setGoalForm({ ...goalForm, draft: { ...goalForm.draft, time: event.target.value } })} /></label>
    <label>득점 팀<select aria-label="득점 팀" value={goalForm.draft.fever ? 'fever' : goalForm.draft.team}
      onChange={(event) => setGoalForm({ ...goalForm, draft: { ...goalForm.draft, fever: event.target.value === 'fever', team: event.target.value === 'fever' ? '' : event.target.value } })}>
      <option value="">선택</option>{round.teams.map((team) => <option key={team} value={team}>{team}팀</option>)}<option value="fever">피버 타임</option>
    </select></label>
    <label>득점자<input type="text" list="admin-member-options" autoComplete="off" value={goalForm.draft.goal} required
      onChange={(event) => setGoalForm({ ...goalForm, draft: { ...goalForm.draft, goal: event.target.value } })} /></label>
    <label>도움<input type="text" list="admin-member-options" autoComplete="off" value={goalForm.draft.assist}
      onChange={(event) => setGoalForm({ ...goalForm, draft: { ...goalForm.draft, assist: event.target.value } })} /></label>
  </EditorForm>
  const renderRoundForm = () => <EditorForm title={roundForm.isNew ? '라운드 추가' : '라운드 수정'}
    onSubmit={applyRound} onCancel={closeForms} canEdit={canEdit && !saving && !hasIncoming} saving={saving} error={formError}>
    <label>시작 시간<input name="time" type="time" step="1" value={roundForm.draft.time} required
      onChange={(event) => setRoundForm({ ...roundForm, draft: { ...roundForm.draft, time: event.target.value } })} /></label>
    <label>결과<select aria-label="결과" value={roundForm.draft.result} onChange={(event) => setRoundForm({ ...roundForm, draft: { ...roundForm.draft, result: event.target.value } })}>
      <option value="playing">진행중</option><option value="draw">무승부</option>
      {roundForm.draft.teams.filter(Boolean).map((team) => <option key={team} value={team}>{team}팀 승</option>)}
    </select></label>
    {[0, 1].map((index) => <label key={index}>경기 팀 {index + 1}<select aria-label={`경기 팀 ${index + 1}`} value={roundForm.draft.teams[index] || ''} required
      onChange={(event) => updateRoundTeam(index, event.target.value)}>
      <option value="">선택</option>{teamOptions.map((team) => <option key={team} value={team}
        disabled={roundForm.draft.teams[1 - index] === team}>{team}팀</option>)}
    </select></label>)}
  </EditorForm>

  return (
    <section className="admin-round-manager" aria-labelledby="admin-round-title">
      <header className="admin-manager-heading">
        <h2 id="admin-round-title">{context.dateLabel} 라운드 기록 관리</h2>
      </header>
      <p className="admin-edit-state"></p>
      {hasIncoming && <div className="admin-incoming" role="status">수정중인 라운드에 새 기록이 도착했습니다.
        <button type="button" disabled={saving} onClick={closeForms}>최신 기록 보기</button>
      </div>}

      <div className="admin-record-container">
        {rounds.map((round) => {
          const editingRound = roundForm?.draft.id === round.id
          const editingGoal = goalForm?.roundId === round.id
          const isWinner = !['playing', 'draw'].includes(round.result)
          const scoreTeams = isWinner ? [round.result, ...round.teams.filter((team) => team !== round.result)] : round.teams
          const scores = getAdminRoundScores(round)
          const score = scoreTeams.map((team) => scores[round.teams.indexOf(team)] ?? 0).join(' : ')
          return <section className="admin-record-round" key={round.id} aria-label={`${round.index + 1}라운드`}>
            <div className="admin-round-band">
              <div className="admin-round-summary">
                <span className="admin-round-number">{round.index + 1} 라운드</span>
                <span className="admin-round-match">
                  {isWinner ? <><span className="admin-winning-team">{round.result}팀 승</span><span className="admin-opponent">vs {scoreTeams[1] || '-'}팀</span></>
                    : round.result === 'draw' ? <><span className="admin-winning-team">무승부</span><span className="admin-opponent">{round.teams.map((team) => `${team}팀`).join(' vs ')}</span></>
                      : <span className="admin-winning-team">{round.teams[0] || '-'}팀 <span className="admin-opponent">vs</span> {round.teams[1] || '-'}팀</span>}
                  <b>{score || '0 : 0'}</b>
                </span>
                <time>{round.time.slice(0, 5)}</time>
              </div>
              <div className="admin-round-actions">
                <TextButton label={`${round.index + 1}라운드 기록 추가`} disabled={!canEdit || controlsLocked || round.teams.length !== 2} onClick={() => openGoalForm(round)}>추가</TextButton>
                <TextButton label={`${round.index + 1}라운드 팀·결과 수정`} disabled={!canEdit || controlsLocked} onClick={() => {
                  setRoundForm({ roundId: round.id, expected: source[round.id], isNew: false, draft: { ...round, teams: [...round.teams] } }); setFormError(''); setNotice('')
                }}>수정</TextButton>
                <TextButton label={`${round.index + 1}라운드 삭제`} className="is-danger" disabled={!canEdit || controlsLocked} onClick={() => confirmDelete(round)}>삭제</TextButton>
              </div>
            </div>
            <div id={`admin-round-${round.id}`} className="admin-round-records">
              {editingRound ? renderRoundForm() : <>
                {round.goals.map((goal) => <div key={goal.id}>
                  {editingGoal && goalForm.draft.id === goal.id ? renderGoalForm(round) : <div className="admin-goal-row">
                    <span className="admin-goal-team">{goal.fever ? '' : goal.team ? `${goal.team}팀` : '?'}</span>
                    <img className="admin-ball-light" src={ballImage} alt="" /><img className="admin-ball-dark" src={darkBallImage} alt="" />
                    <time>{goal.time.slice(0, 5)}</time>
                    <button type="button" className="admin-goal-players" aria-label={`${round.index + 1}라운드 ${goal.goal} 이름으로 기록 수정`}
                      disabled={!canEdit || controlsLocked} onClick={() => openGoalForm(round, goal)}>
                      <span className="admin-player"><small>Goal</small><strong>{goal.goal || '-'}</strong></span>
                      {goal.assist && <span className="admin-player"><small>Assist</small><strong>{goal.assist}</strong></span>}
                    </button>
                    {goal.fever && <span className="admin-fever-label">피버</span>}
                    <div className="admin-goal-actions">
                      <TextButton label={`${round.index + 1}라운드 ${goal.goal} 기록 수정`} disabled={!canEdit || controlsLocked} onClick={() => openGoalForm(round, goal)}>수정</TextButton>
                      <TextButton label={`${round.index + 1}라운드 ${goal.goal} 기록 삭제`} className="is-danger" disabled={!canEdit || controlsLocked} onClick={() => confirmDelete(round, goal)}>삭제</TextButton>
                    </div>
                  </div>}
                </div>)}
                {!round.goals.length && !editingGoal && <p className="admin-no-goals">득점 없당</p>}
                {editingGoal && goalForm.isNew && renderGoalForm(round)}
              </>}
            </div>
          </section>
        })}
        {!rounds.length && <p className="admin-empty">{loading ? '기록 불러오는 중' : '등록된 라운드가 없습니다.'}</p>}
        {roundForm?.isNew ? renderRoundForm() : <button type="button" className="admin-add-round" disabled={!canEdit || controlsLocked || teamOptions.length < 2 || Boolean(playingRound)} onClick={() => {
          setRoundForm({ isNew: true, expected: source || {}, draft: createAdminRound(rounds, teamOptions, rounds.length ? context.timeLabel : '08:00:00') }); setFormError(''); setNotice('')
        }}>라운드 추가</button>}
        {playingRound && !hasForm && <p className="admin-save-notice" role="status">
          이전 라운드의 결과를 저장해야 새 라운드를 추가할 수 있습니다.
        </p>}
      </div>
      <p className="admin-save-notice" role={statsPending ? 'alert' : 'status'}>{saving ? '기록 저장중' : notice}</p>
      {statsPending && <button type="button" className="admin-command" disabled={saving || !context.canEdit} onClick={async () => {
        if (savingRef.current) return
        savingRef.current = true
        setSaving(true)
        try {
          await onRetry()
          setStatsPending(false)
          setNotice('현황판 집계를 저장했습니다.')
        } catch (error) { setNotice(`현황판 집계에 실패했습니다. ${error.message}`) }
        finally { savingRef.current = false; setSaving(false) }
      }}>집계 재시도</button>}
      <datalist id="admin-member-options">{playerOptions.map((name) => <option key={name} value={name} />)}</datalist>
      {confirmation && <Confirmation value={confirmation} onClose={() => { setConfirmation(null); setFormError('') }} canEdit={canEdit} saving={saving} error={formError} />}
    </section>
  )
}

export default function AdminRoundManager() {
  const { time: { currentTime } } = getTimes()
  const { todaysRealtimeRound, totalWeeklyTeamData } = getRecords()
  const { existingMembers, totalMembers, oneCharacterMembers, membersNickName } = getMembers()
  const context = getAdminMatchContext(currentTime)
  const rounds = useMemo(() => createAdminRoundDrafts(todaysRealtimeRound), [todaysRealtimeRound])
  const weeklyTeam = totalWeeklyTeamData?.find((item) => item.id === context.weeklyTeamId)?.data || {}
  const memberInfo = { members: totalMembers, oneCharacterMembers, nicknames: membersNickName, weeklyTeam: { data: weeklyTeam } }
  return <AdminRoundEditor key={context.key} context={context} source={todaysRealtimeRound} seed={rounds} teams={weeklyTeam}
    members={existingMembers} loading={todaysRealtimeRound == null}
    onSave={(operation) => adminRoundWrites.save(context, operation, memberInfo)}
    onRetry={() => adminRoundWrites.retryStats(context, memberInfo)} />
}
