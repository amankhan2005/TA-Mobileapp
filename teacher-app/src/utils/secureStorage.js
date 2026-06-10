import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN:        'ta_auth_token',
  USER:         'ta_user_data',
  DEVICE_ID:    'ta_device_id',
  TERMS_AGREED: 'ta_terms_v1_agreed',
  PERMISSIONS_SHOWN: 'ta_permissions_shown_v1',
};

export const storage = {
  // Token
  async setToken(token) {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  },
  async getToken() {
    return await SecureStore.getItemAsync(KEYS.TOKEN);
  },
  async deleteToken() {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
  },

  // User
  async setUser(user) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async deleteUser() {
    await SecureStore.deleteItemAsync(KEYS.USER);
  },

  // Device ID
  async setDeviceId(id) {
    await SecureStore.setItemAsync(KEYS.DEVICE_ID, id);
  },
  async getDeviceId() {
    return await SecureStore.getItemAsync(KEYS.DEVICE_ID);
  },

  // Terms acceptance
  async setTermsAgreed() {
    await SecureStore.setItemAsync(KEYS.TERMS_AGREED, 'true');
  },
  async setPermissionsShown() {
    await SecureStore.setItemAsync(KEYS.PERMISSIONS_SHOWN, 'true');
  },
  async getPermissionsShown() {
    const v = await SecureStore.getItemAsync(KEYS.PERMISSIONS_SHOWN);
    return v === 'true';
  },
  async getTermsAgreed() {
    const val = await SecureStore.getItemAsync(KEYS.TERMS_AGREED);
    return val === 'true';
  },

  // Full logout clear
  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
    // Keep DEVICE_ID and TERMS_AGREED across logouts
  },
};
