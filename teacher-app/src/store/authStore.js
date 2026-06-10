import { create } from 'zustand';
import { storage } from '../utils/secureStorage';
import * as Crypto from 'expo-crypto';

const useAuthStore = create((set, get) => ({
  token:          null,
  user:           null,
  deviceId:       null,
  isLoading:      true,  // true until hydration complete
  isAuthenticated: false,

  // Called at app boot — reads from SecureStore
  hydrate: async () => {
    try {
      const [token, user, storedDeviceId] = await Promise.all([
        storage.getToken(),
        storage.getUser(),
        storage.getDeviceId(),
      ]);

      // Generate device ID if first launch
      let deviceId = storedDeviceId;
      if (!deviceId) {
        deviceId = await Crypto.randomUUID();
        await storage.setDeviceId(deviceId);
      }

      set({
        token,
        user,
        deviceId,
        isAuthenticated: !!token && !!user,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // Called after successful login
  setAuth: async (token, user) => {
    await storage.setToken(token);
    await storage.setUser(user);
    set({ token, user, isAuthenticated: true });
  },

  // Called on logout or 401
  clearAuth: async () => {
    await storage.clearAll();
    set({ token: null, user: null, isAuthenticated: false });
  },

  // Update user fields (e.g. after profile change)
  updateUser: async (updates) => {
    const updated = { ...get().user, ...updates };
    await storage.setUser(updated);
    set({ user: updated });
  },
}));

export default useAuthStore;
