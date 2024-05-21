import { create } from 'zustand'

const useStore = create((set) => ({
  yearData: {},
  weeklyTeamData: null,
  rtDB: null,
  updateYearData: (newYearData) => set({ yearData: newYearData }),
  updateWeeklyTeamData: (newWeeklyTeamData) => set({ weeklyTeamData: newWeeklyTeamData }),
  updateRtDB: (newRtDB) => set({ rtDB: newRtDB }),
}))

export default useStore