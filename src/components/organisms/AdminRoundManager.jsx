import { useEffect, useMemo, useRef, useState } from 'react'
import getTimes from '@/hooks/getTimes.js'
import getRecords from '@/hooks/getRecords.js'
import getMembers from '@/hooks/getMembers.js'
import {
  adminPreviewRounds, adminPreviewTeams, createAdminRound, createAdminRoundDrafts,
  getAdminMatchContext, getAdminRoundScores, removeAdminGoal, replaceAdminGoal, validateAdminGoal,
} from '@/apis/adminRoundDraft.js'
import PencilIcon from '@/assets/lucide/pencil.svg?react'
import TrashIcon from '@/assets/lucide/trash.svg?react'
import PlusIcon from '@/assets/lucide/plus.svg?react'
import ResetIcon from '@/assets/lucide/rotate-ccw.svg?react'
import CheckIcon from '@/assets/lucide/check.svg?react'
import CloseIcon from '@/assets/lucide/x.svg?react'
import ChevronIcon from '@/assets/lucide/chevron-right.svg?react'
import EyeIcon from '@/assets/lucide/eye.svg?react'
import ballImage from '@/assets/futsal-ball4.png'
import darkBallImage from '@/assets/futsal-ball-yellow.png'
import './AdminRoundManager.css'

const fingerprint = (value) => JSON.stringify(value)

const IconButton = ({ label, children, className = '', ...props }) => (
  <button type="button" className={`admin-icon-button ${className}`} aria-label={label} title={label} {...props}>
    {children}
  </button>
)

function Confirmation({ value, onClose, canEdit }) {
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current?.showModal() }, [])
  return (
    <dialog ref={dialogRef} className="admin-confirm-dialog" onCancel={onClose} onClose={onClose}
      aria-labelledby="admin-confirm-title" onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
      }}>
      <h3 id="admin-confirm-title">{value.title}</h3>
      <p>{value.message}</p>
      <div className="admin-form-actions">
        <button type="button" className="admin-command" onClick={onClose}>취소</button>
        <button type="button" className={`admin-command ${value.danger ? 'is-danger' : 'is-primary'}`}
          disabled={value.requiresEdit && !canEdit} onClick={() => { value.action(); onClose() }}>
          {value.danger ? <TrashIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}{value.label}
        </button>
      </div>
    </dialog>
  )
}

function EditorForm({ title, onSubmit, onCancel, canEdit, error, children }) {
  return <form className="admin-record-form" onSubmit={onSubmit}>
    <div className="admin-form-heading"><h4>{title}</h4>
      <IconButton label="편집 취소" onClick={onCancel}><CloseIcon aria-hidden="true" /></IconButton>
    </div>
    <fieldset disabled={!canEdit} className="admin-field-grid">{children}</fieldset>
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <div className="admin-form-actions">
      <button type="button" className="admin-command" onClick={onCancel}>취소</button>
      <button type="submit" className="admin-command is-primary" disabled={!canEdit}><CheckIcon aria-hidden="true" />초안 적용</button>
    </div>
  </form>
}

function RoundEditor({ seed, teams, members, context, mode, onModeChange, loading }) {
  const [baseline, setBaseline] = useState(seed)
  const [rounds, setRounds] = useState(seed)
  const [closedRounds, setClosedRounds] = useState(new Set())
  const [goalForm, setGoalForm] = useState(null)
  const [roundForm, setRoundForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState('')
  const dirty = fingerprint(rounds) !== fingerprint(baseline)
  const hasIncoming = fingerprint(seed) !== fingerprint(baseline)
  const canEdit = mode === 'preview' || context.canEdit
  const hasForm = Boolean(goalForm || roundForm)
  const teamOptions = [...new Set([...Object.keys(teams).filter((team) => Array.isArray(teams[team])
    && teams[team].some((name) => typeof name === 'string' && name.trim())), ...rounds.flatMap((round) => round.teams)])].sort()
  const playerOptions = [...new Set([...members, ...Object.values(teams).flat(),
    ...rounds.flatMap((round) => round.goals.flatMap((goal) => [goal.goal, goal.assist]))])]
    .filter((name) => typeof name === 'string' && name.trim()).sort((a, b) => a.localeCompare(b, 'ko'))

  useEffect(() => {
    if (dirty || hasForm) return
    setBaseline(seed)
    setRounds(seed)
  }, [seed, dirty, hasForm])

  const closeForms = () => { setGoalForm(null); setRoundForm(null); setFormError('') }
  const reset = () => {
    closeForms()
    setRounds(seed)
    setBaseline(seed)
    setClosedRounds(new Set())
    setNotice('초안을 초기화했습니다.')
  }
  const requestNavigation = (action) => {
    if (!hasForm && !dirty) { action(); return }
    setConfirmation({ title: '초안을 닫을까요?', message: '이 화면의 변경사항이 사라집니다.',
      label: '닫기', action: () => { closeForms(); action() } })
  }
  const expandRound = (id) => setClosedRounds((previous) => {
    const next = new Set(previous)
    next.delete(id)
    return next
  })
  const openGoalForm = (round, goal) => {
    if (!canEdit || hasForm) return
    expandRound(round.id)
    setFormError('')
    setGoalForm({ roundId: round.id, isNew: !goal, draft: goal ? { ...goal } : {
      id: `draft-goal-${crypto.randomUUID()}`, time: round.time || '08:00:00',
      goal: '', assist: '', team: round.teams[0] || '', fever: false,
    } })
    setNotice('')
  }
  const applyGoal = (event) => {
    event.preventDefault()
    const round = rounds.find((item) => item.id === goalForm.roundId)
    if (!canEdit || !round) return
    const error = validateAdminGoal(goalForm.draft, round)
    if (error) { setFormError(error); return }
    const goal = { ...goalForm.draft, goal: goalForm.draft.goal.trim(), assist: goalForm.draft.assist.trim() }
    setRounds((previous) => replaceAdminGoal(previous, round.id, goal))
    setNotice(goalForm.isNew ? '기록을 초안에 추가했습니다.' : '기록을 초안에 반영했습니다.')
    closeForms()
  }
  const applyRound = (event) => {
    event.preventDefault()
    if (!canEdit) return
    const draft = roundForm.draft
    if (!draft.teams[0] || !draft.teams[1] || draft.teams[0] === draft.teams[1]) {
      setFormError('서로 다른 두 팀을 선택해주세요.'); return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(draft.time)) {
      setFormError('라운드 시작 시간을 확인해주세요.'); return
    }
    const next = { ...draft, goals: draft.goals.map((goal) => goal.fever || draft.teams.includes(goal.team)
      ? goal : { ...goal, team: '' }) }
    setRounds((previous) => roundForm.isNew ? [...previous, next]
      : previous.map((round) => round.id === draft.id ? { ...round, ...next } : round))
    expandRound(draft.id)
    setNotice(roundForm.isNew ? '라운드를 초안에 추가했습니다.' : '라운드를 초안에 반영했습니다.')
    closeForms()
  }
  const updateRoundTeam = (index, value) => {
    const nextTeams = [...roundForm.draft.teams]
    nextTeams[index] = value
    const result = ['playing', 'draw', ...nextTeams].includes(roundForm.draft.result) ? roundForm.draft.result : 'playing'
    setRoundForm({ ...roundForm, draft: { ...roundForm.draft, teams: nextTeams, result } })
  }
  const confirmDelete = (round, goal) => {
    if (!canEdit || hasForm) return
    setConfirmation({ title: goal ? '기록을 삭제할까요?' : `${round.index + 1}라운드를 삭제할까요?`,
      message: goal ? `${goal.time.slice(0, 5)} · ${goal.goal}${goal.assist ? ` / ${goal.assist}` : ''}` : '이 라운드의 골·어시 기록도 함께 삭제됩니다.',
      label: '초안에서 삭제', danger: true, requiresEdit: true,
      action: () => {
        setRounds((previous) => goal ? removeAdminGoal(previous, round.id, goal.id) : previous.filter((item) => item.id !== round.id))
        setNotice(goal ? '기록을 초안에서 삭제했습니다.' : '라운드를 초안에서 삭제했습니다.')
      } })
  }
  const renderGoalForm = (round) => <EditorForm title={goalForm.isNew ? '골·어시 추가' : '골·어시 수정'}
    onSubmit={applyGoal} onCancel={closeForms} canEdit={canEdit} error={formError}>
    <label>기록 시간<input type="time" step="1" value={goalForm.draft.time} required
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
    onSubmit={applyRound} onCancel={closeForms} canEdit={canEdit} error={formError}>
    <label>시작 시간<input type="time" step="1" value={roundForm.draft.time} required
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
        <div className="admin-manager-tools">
          <button type="button" className="admin-preview-toggle" aria-pressed={mode === 'preview'}
            onClick={() => requestNavigation(() => onModeChange(mode === 'preview' ? 'live' : 'preview'))}>
            <EyeIcon aria-hidden="true" />미리보기
          </button>
          <IconButton label="초안 초기화" disabled={!dirty && !hasForm && !hasIncoming} onClick={() => requestNavigation(reset)}><ResetIcon aria-hidden="true" /></IconButton>
        </div>
      </header>
      <p className="admin-edit-state">{mode === 'preview' ? '예시 기록' : context.canEdit ? '일요일 08:00 - 10:00' : '열람 전용'} · 로컬 초안{dirty && ' · 변경사항 있음'}</p>
      {hasIncoming && <div className="admin-incoming" role="status">새 기록이 도착했습니다.
        <button type="button" onClick={() => requestNavigation(reset)}>최신 기록 보기</button>
      </div>}

      <div className="admin-record-container">
        {rounds.map((round) => {
          const isClosed = closedRounds.has(round.id)
          const editingRound = roundForm?.draft.id === round.id
          const editingGoal = goalForm?.roundId === round.id
          const isWinner = !['playing', 'draw'].includes(round.result)
          const scoreTeams = isWinner ? [round.result, ...round.teams.filter((team) => team !== round.result)] : round.teams
          const scores = getAdminRoundScores(round)
          const score = scoreTeams.map((team) => scores[round.teams.indexOf(team)] ?? 0).join(' : ')
          return <section className="admin-record-round" key={round.id} aria-label={`${round.index + 1}라운드`}>
            <div className="admin-round-band">
              <button type="button" className="admin-round-summary" aria-expanded={!isClosed} aria-controls={`admin-round-${round.id}`}
                disabled={hasForm} onClick={() => setClosedRounds((previous) => {
                  const next = new Set(previous)
                  if (next.has(round.id)) next.delete(round.id)
                  else next.add(round.id)
                  return next
                })}>
                <span className="admin-round-number">{round.index + 1} 라운드</span>
                <span className="admin-round-match">
                  {isWinner ? <><span className="admin-winning-team">{round.result}팀 승</span><span className="admin-opponent">vs {scoreTeams[1] || '-'}팀</span></>
                    : round.result === 'draw' ? <><span className="admin-winning-team">무승부</span><span className="admin-opponent">{round.teams.map((team) => `${team}팀`).join(' vs ')}</span></>
                      : <span className="admin-winning-team">{round.teams[0] || '-'}팀 <span className="admin-opponent">vs</span> {round.teams[1] || '-'}팀</span>}
                  <b>{score || '0 : 0'}</b>
                </span>
                <time>{round.time.slice(0, 5)}</time>
                <ChevronIcon className={isClosed ? '' : 'is-expanded'} aria-hidden="true" />
              </button>
              <div className="admin-round-actions">
                <IconButton label={`${round.index + 1}라운드 기록 추가`} disabled={!canEdit || hasForm || round.teams.length !== 2} onClick={() => openGoalForm(round)}><PlusIcon aria-hidden="true" /></IconButton>
                <IconButton label={`${round.index + 1}라운드 팀·결과 수정`} disabled={!canEdit || hasForm} onClick={() => {
                  expandRound(round.id)
                  setRoundForm({ isNew: false, draft: { ...round, teams: [...round.teams] } }); setFormError(''); setNotice('')
                }}><PencilIcon aria-hidden="true" /></IconButton>
                <IconButton label={`${round.index + 1}라운드 삭제`} className="is-danger" disabled={!canEdit || hasForm} onClick={() => confirmDelete(round)}><TrashIcon aria-hidden="true" /></IconButton>
              </div>
            </div>
            <div id={`admin-round-${round.id}`} hidden={isClosed} className="admin-round-records">
              {editingRound ? renderRoundForm() : <>
                {round.goals.map((goal) => <div key={goal.id}>
                  {editingGoal && goalForm.draft.id === goal.id ? renderGoalForm(round) : <div className="admin-goal-row">
                    <span className="admin-goal-team">{goal.fever ? '' : goal.team ? `${goal.team}팀` : '?'}</span>
                    <img className="admin-ball-light" src={ballImage} alt="" /><img className="admin-ball-dark" src={darkBallImage} alt="" />
                    <time>{goal.time.slice(0, 5)}</time>
                    <button type="button" className="admin-goal-players" aria-label={`${round.index + 1}라운드 ${goal.goal} 기록 수정`}
                      disabled={!canEdit || hasForm} onClick={() => openGoalForm(round, goal)}>
                      <span className="admin-player"><small>Goal</small><strong>{goal.goal || '-'}</strong></span>
                      {goal.assist && <span className="admin-player"><small>Assist</small><strong>{goal.assist}</strong></span>}
                    </button>
                    {goal.fever && <span className="admin-fever-label">피버</span>}
                    <IconButton label={`${round.index + 1}라운드 ${goal.goal} 기록 삭제`} className="is-danger" disabled={!canEdit || hasForm} onClick={() => confirmDelete(round, goal)}><TrashIcon aria-hidden="true" /></IconButton>
                  </div>}
                </div>)}
                {!round.goals.length && !editingGoal && <p className="admin-no-goals">득점 없당</p>}
                {editingGoal && goalForm.isNew && renderGoalForm(round)}
              </>}
            </div>
          </section>
        })}
        {!rounds.length && <p className="admin-empty">{loading ? '기록 불러오는 중' : '등록된 라운드가 없습니다.'}</p>}
        {roundForm?.isNew ? renderRoundForm() : <button type="button" className="admin-add-round" disabled={!canEdit || hasForm || loading || teamOptions.length < 2} onClick={() => {
          setRoundForm({ isNew: true, draft: createAdminRound(rounds, teamOptions) }); setFormError(''); setNotice('')
        }}><PlusIcon aria-hidden="true" />라운드 추가</button>}
      </div>
      <p className="admin-draft-notice" role="status">{notice}</p>
      <datalist id="admin-member-options">{playerOptions.map((name) => <option key={name} value={name} />)}</datalist>
      {confirmation && <Confirmation value={confirmation} onClose={() => setConfirmation(null)} canEdit={canEdit} />}
    </section>
  )
}

export default function AdminRoundManager() {
  const { time: { currentTime } } = getTimes()
  const { todaysRealtimeRound, totalWeeklyTeamData } = getRecords()
  const { existingMembers } = getMembers()
  const [mode, setMode] = useState('live')
  const context = getAdminMatchContext(currentTime)
  const rounds = useMemo(() => createAdminRoundDrafts(todaysRealtimeRound), [todaysRealtimeRound])
  const weeklyTeam = totalWeeklyTeamData?.find((item) => item.id === context.weeklyTeamId)?.data || {}
  return <RoundEditor key={`${mode}:${context.key}`} mode={mode} onModeChange={setMode} context={context}
    seed={mode === 'preview' ? adminPreviewRounds : rounds} teams={mode === 'preview' ? adminPreviewTeams : weeklyTeam}
    members={existingMembers} loading={mode === 'live' && todaysRealtimeRound == null} />
}
