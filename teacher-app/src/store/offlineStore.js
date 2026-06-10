/**
 * Offline attendance queue — stores failed submissions and retries them.
 * Uses AsyncStorage for persistence across app restarts.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { attendanceService } from '../api/attendance.service';

const QUEUE_KEY = 'ta_offline_queue_v1';

const useOfflineStore = create((set, get) => ({
  queue:   [],        // Array of pending entries
  syncing: false,

  // Load queue from AsyncStorage on boot
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) set({ queue: JSON.parse(raw) });
    } catch {}
  },

  // Save queue to AsyncStorage
  _persist: async (queue) => {
    try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
  },

  // Add a failed WiFi attendance to queue
  enqueue: async (entry) => {
    const item = { ...entry, id: Date.now().toString(), attempts: 0, enqueuedAt: new Date().toISOString() };
    const queue = [...get().queue, item];
    set({ queue });
    await get()._persist(queue);
  },

  // Remove a successfully synced entry
  dequeue: async (id) => {
    const queue = get().queue.filter(e => e.id !== id);
    set({ queue });
    await get()._persist(queue);
  },

  // Check if today's attendance already in queue (prevent duplicates)
  hasToday: (today) => get().queue.some(e => e.date === today),

  // Attempt to sync all pending entries
  syncAll: async (deviceId) => {
    if (get().syncing) return;
    const queue = get().queue;
    if (!queue.length) return;

    set({ syncing: true });
    for (const entry of queue) {
      try {
        await attendanceService.markWifi({
          wifiSSID:    entry.wifiSSID,
          gatewayIp:   entry.gatewayIp,
          gpsLatitude: entry.gpsLat,
          gpsLongitude:entry.gpsLon,
          deviceId,
          hasVPN:      entry.hasVPN || false,
          hasMockGPS:  entry.hasMockGPS || false,
        });
        await get().dequeue(entry.id);
      } catch (err) {
        // If 409 (already marked), remove from queue — duplicate
        if (err?.status === 409) await get().dequeue(entry.id);
        // Otherwise leave in queue for next sync
        const queue = get().queue.map(e =>
          e.id === entry.id ? { ...e, attempts: (e.attempts || 0) + 1, lastError: err?.message } : e
        );
        set({ queue });
        await get()._persist(queue);
      }
    }
    set({ syncing: false });
  },

  clearAll: async () => {
    set({ queue: [] });
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
}));

export default useOfflineStore;
