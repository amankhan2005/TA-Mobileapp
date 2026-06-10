import client from './client';
export const inquiryService = {
  async submit({ category, subject, message }) { const r = await client.post('/api/teacher-inquiries', { category, subject, message }); return r.data; },
  async getMyInquiries({ page=1, limit=20 }={}) { const r = await client.get('/api/teacher-inquiries/my', { params:{page,limit} }); return r.data; },
};
