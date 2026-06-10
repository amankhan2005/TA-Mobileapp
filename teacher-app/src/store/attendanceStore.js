import { create } from 'zustand';
import { getTodayString } from '../utils/formatDate';

const useAttendanceStore = create((set, get) => ({
  todayRecord:  null,   // null = unknown/not-marked, object = record for today
  history:      [],
  historyMonth: null,
  historyYear:  null,
  lastFetched:  null,

  setTodayRecord: (record) => set({ todayRecord: record }),

  setHistory: (records, month, year) => set({
    history: records,
    historyMonth: month,
    historyYear: year,
    lastFetched: new Date().toISOString(),
  }),

  isMarkedToday: () => {
    const today = getTodayString();
    const { todayRecord } = get();
    return !!(todayRecord && todayRecord.date === today);
  },

  clear: () => set({ todayRecord: null, history: [], lastFetched: null }),
}));

export default useAttendanceStore;
