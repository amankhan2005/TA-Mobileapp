import client from './client';

export const attendanceService = {
  // Mark WiFi attendance
  async markWifi({ wifiSSID, gatewayIp, gpsLatitude, gpsLongitude, deviceId, hasVPN, hasMockGPS }) {
    const res = await client.post('/api/attendance/wifi', {
      wifiSSID, gatewayIp, gpsLatitude, gpsLongitude, deviceId, hasVPN, hasMockGPS,
    });
    return res.data;
  },

  // Mark QR attendance (multipart with selfie)
  // CRITICAL FIX: Do NOT manually set Content-Type for multipart/form-data.
  // When axios detects a FormData body it automatically sets the correct
  // Content-Type INCLUDING the required boundary parameter.
  // Manually setting 'Content-Type: multipart/form-data' strips the boundary
  // which causes multer to fail parsing the request and req.file is undefined.
  async markQR({ qrToken, deviceId, selfieUri }) {
    const form = new FormData();
    form.append('qrToken', qrToken);
    form.append('deviceId', deviceId);
    form.append('selfie', {
      uri: selfieUri,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`,
    });
    const res = await client.post('/api/attendance/qr', form, {
      // Do NOT set Content-Type here — axios auto-detects multipart/form-data
      // with the correct boundary when body is FormData
      timeout: 30000, // selfie upload may take longer
    });
    return res.data;
  },

  // Teacher's own attendance history
  async getHistory({ month, year } = {}) {
    const params = {};
    if (month) params.month = month;
    if (year)  params.year  = year;
    const res = await client.get('/api/attendance/my-history', { params });
    return res.data; // { success, total, records }
  },
};
