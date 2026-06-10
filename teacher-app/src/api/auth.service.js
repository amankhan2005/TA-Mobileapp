import client from './client';

export const authService = {
  async login({ email, password, deviceId }) {
    const res = await client.post('/api/auth/teacher/login', { email, password, deviceId });
    return res.data; // { success, token, user }
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await client.put('/api/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  async forgotPassword({ email }) {
    const res = await client.post('/api/auth/forgot-password', { email, role: 'schoolAdmin' });
    return res.data;
  },
};
