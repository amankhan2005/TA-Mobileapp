import client from './client';

export const teacherService = {
  // Issue 7/8: Get own profile with school logo
  async getMyProfile() {
    const res = await client.get('/api/teachers/me');
    return res.data; // { success, teacher: { ...fields, school: { name, logoUrl } } }
  },

  // Issue 8: Upload profile photo
  async uploadPhoto(imageUri) {
    const form = new FormData();
    form.append('photo', { uri: imageUri, type: 'image/jpeg', name: `profile_${Date.now()}.jpg` });
    const res = await client.patch('/api/teachers/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data;
  },

  // Issue 9: Request account deletion
  async requestDeletion(reason) {
    const res = await client.post('/api/teachers/me/request-deletion', { reason });
    return res.data;
  },
};
