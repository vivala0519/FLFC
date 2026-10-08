import { atom } from 'jotai'
import { createCurrentTimeState } from '../apis/currentTimeState.js'

// members
export const totalMembersAtom = atom([])
export const existingMembersAtom = atom([])
export const retiredMembersAtom = atom([])
export const oneCharacterMembersAtom = atom([])
export const membersNickNameAtom = atom([])
export const membersIdAtom = atom([])

// records
const todaysRealtimeRound = null
const requestList = []
const firestoreRecord = null
const statusBoardStat = null
const totalWeeklyTeamData = null

export const todaysRealtimeRoundAtom = atom(todaysRealtimeRound)
export const requestListAtom = atom(requestList)
export const firestoreRecordAtom = atom(firestoreRecord)
export const statusBoardStatAtom = atom(statusBoardStat)
export const totalWeeklyTeamDataAtom = atom(totalWeeklyTeamData)
export const gameStatusAtom = atom(null)
export const todaysMVPAtom = atom(null)

// votes
const voteList = []
export const voteListAtom = atom(voteList)

export const timeAtom = atom(createCurrentTimeState())
