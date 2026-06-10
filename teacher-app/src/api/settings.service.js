import client from './client';

export const settingsService = {
  // Returns full settings including supportPhone/Email/WhatsApp and weeklyOffDays/holidays
  async getSettings() {
    const res = await client.get('/api/settings/');
    return res.data; // { success, settings }
  },
};
