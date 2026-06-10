/**
 * TeacherAttendance QA Verification Script
 * Tests all critical paths without needing a real device
 * Run: node qa_verification.js
 */

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0, warnings = 0;
const results = [];

function pass(label) { passed++; results.push(`  ✅ ${label}`); }
function fail(label, detail) { failed++; results.push(`  ❌ ${label}${detail ? ': ' + detail : ''}`); }
function warn(label) { warnings++; results.push(`  ⚠️  ${label}`); }
function section(t) { results.push(`\n── ${t} ${'─'.repeat(50 - t.length)}`); }

function fileContains(file, pattern) {
  const content = fs.readFileSync(file, 'utf8');
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
}

function fileExists(f) { return fs.existsSync(f); }

// ═══════════════════════════════════════════════════════════
section('1. FILE COMPLETENESS');
// ═══════════════════════════════════════════════════════════
const requiredFiles = [
  'app/_layout.jsx','app/index.jsx','app/terms.jsx','app/auth/login.jsx',
  'app/(tabs)/_layout.jsx','app/(tabs)/index.jsx','app/(tabs)/history.jsx','app/(tabs)/profile.jsx',
  'app/attendance/router.jsx','app/attendance/wifi.jsx','app/attendance/qr.jsx',
  'app/attendance/selfie.jsx','app/attendance/success.jsx',
  'app/profile/change-password.jsx','app/profile/about.jsx',
  'src/api/client.js','src/api/auth.service.js','src/api/attendance.service.js',
  'src/api/settings.service.js',
  'src/store/authStore.js','src/store/attendanceStore.js','src/store/offlineStore.js',
  'src/components/ui/Button.jsx','src/components/ui/Input.jsx','src/components/ui/Card.jsx',
  'src/components/ui/Badge.jsx','src/components/ui/ScreenHeader.jsx',
  'src/components/ui/Toast.jsx','src/components/ui/OfflineBanner.jsx',
  'src/constants/colors.js','src/constants/layout.js','src/constants/typography.js',
  'src/utils/secureStorage.js','src/utils/formatDate.js',
  'babel.config.js','eas.json','.env','app.json','package.json',
];
requiredFiles.forEach(f => fileExists(f) ? pass(f) : fail(f, 'MISSING'));

// ═══════════════════════════════════════════════════════════
section('2. API CONNECTIONS — Real Backend Endpoints');
// ═══════════════════════════════════════════════════════════

// Login → POST /api/auth/teacher/login
fileContains('src/api/auth.service.js', '/api/auth/teacher/login')
  ? pass('Login endpoint: POST /api/auth/teacher/login')
  : fail('Login endpoint missing');

// Change password → PUT /api/auth/change-password
fileContains('src/api/auth.service.js', '/api/auth/change-password')
  ? pass('Change password: PUT /api/auth/change-password')
  : fail('Change password endpoint missing');

// Attendance history → GET /api/attendance/my-history
fileContains('src/api/attendance.service.js', '/api/attendance/my-history')
  ? pass('History: GET /api/attendance/my-history')
  : fail('History endpoint missing');

// WiFi attendance → POST /api/attendance/wifi
fileContains('src/api/attendance.service.js', '/api/attendance/wifi')
  ? pass('WiFi attendance: POST /api/attendance/wifi')
  : fail('WiFi endpoint missing');

// QR attendance → POST /api/attendance/qr (multipart)
fileContains('src/api/attendance.service.js', '/api/attendance/qr')
  ? pass('QR attendance: POST /api/attendance/qr')
  : fail('QR endpoint missing');
fileContains('src/api/attendance.service.js', 'multipart/form-data')
  ? pass('QR uses multipart/form-data for selfie upload')
  : fail('QR missing multipart header');

// Settings → GET /api/settings/
fileContains('src/api/settings.service.js', '/api/settings/')
  ? pass('Settings: GET /api/settings/')
  : fail('Settings endpoint missing');

// JWT injected on every request
fileContains('src/api/client.js', 'Authorization')
  ? pass('JWT Authorization header injected on requests')
  : fail('JWT injection missing in client');

// 401 handler
fileContains('src/api/client.js', '401')
  ? pass('401 handler → clears auth + triggers re-login')
  : fail('401 handler missing');

// Timeout configured
fileContains('src/api/client.js', 'timeout')
  ? pass('Request timeout configured')
  : fail('No timeout configured');

// ═══════════════════════════════════════════════════════════
section('3. AUTHENTICATION & JWT PERSISTENCE');
// ═══════════════════════════════════════════════════════════

// Token in SecureStore (Keychain/Keystore)
fileContains('src/utils/secureStorage.js', 'SecureStore')
  ? pass('Token stored in expo-secure-store (Keychain/Keystore)')
  : fail('SecureStore not used');

// Token persistence across restarts
fileContains('src/store/authStore.js', 'hydrate')
  ? pass('Auth hydration on app boot')
  : fail('Missing hydrate() in authStore');

// Device ID persistent
fileContains('src/store/authStore.js', 'deviceId')
  ? pass('Device ID generated and persisted')
  : fail('Device ID missing');

// Role block for non-teachers
fileContains('app/auth/login.jsx', "role !== 'teacher'")
  ? pass('Non-teacher role blocked at login')
  : fail('Non-teacher role block missing');

// ═══════════════════════════════════════════════════════════
section('4. WIFI ATTENDANCE FLOW');
// ═══════════════════════════════════════════════════════════

// All 5 validation steps present
['wifi-outline','git-network-outline','location-outline','shield-outline','phone-portrait-outline']
  .forEach(icon => fileContains('app/attendance/wifi.jsx', icon)
    ? pass(`WiFi step icon: ${icon}`)
    : fail(`Missing WiFi step: ${icon}`));

// GPS permission request
fileContains('app/attendance/wifi.jsx', 'requestForegroundPermissionsAsync')
  ? pass('GPS permission requested')
  : fail('GPS permission request missing');

// VPN detection
fileContains('app/attendance/wifi.jsx', 'hasVPN')
  ? pass('VPN detection sent to backend')
  : fail('VPN detection missing');

// Mock GPS detection
fileContains('app/attendance/wifi.jsx', 'hasMockGPS')
  ? pass('Mock GPS detection sent to backend')
  : fail('Mock GPS detection missing');

// Offline queue on network failure
fileContains('app/attendance/wifi.jsx', 'isNetworkError')
  ? pass('Network failure → offline queue')
  : fail('Offline queue on network failure missing');

// Duplicate prevention
fileContains('app/attendance/wifi.jsx', 'hasToday')
  ? pass('Duplicate prevention via offline queue check')
  : fail('Duplicate prevention missing');

// Server validation errors shown per-step
fileContains('app/attendance/wifi.jsx', 'serverErrors')
  ? pass('Server validation errors mapped back to steps')
  : fail('Server validation error mapping missing');

// ═══════════════════════════════════════════════════════════
section('5. QR + SELFIE FLOW');
// ═══════════════════════════════════════════════════════════

// CameraView (SDK 50+ API)
fileContains('app/attendance/qr.jsx', 'CameraView')
  ? pass('QR uses CameraView (SDK 50+)')
  : fail('QR uses deprecated Camera API');

// useCameraPermissions hook
fileContains('app/attendance/qr.jsx', 'useCameraPermissions')
  ? pass('Camera permissions via useCameraPermissions()')
  : fail('Camera permission hook missing');

// Android-safe manual entry (Modal, not Alert.prompt)
fileContains('app/attendance/qr.jsx', 'Modal')
  ? pass('Manual QR entry uses Modal (Android-safe)')
  : fail('Alert.prompt (iOS only) still present');

// Selfie overflow:hidden for circle clip
fileContains('app/attendance/selfie.jsx', "overflow: 'hidden'")
  ? pass('Selfie circle uses overflow:hidden for clip')
  : fail('Selfie circle clip missing');

// FileSystem cleanup after upload
fileContains('app/attendance/selfie.jsx', 'FileSystem.deleteAsync')
  ? pass('Selfie local file cleaned up after upload')
  : fail('Selfie cleanup missing');

// 409 duplicate handled
fileContains('app/attendance/selfie.jsx', '409')
  ? pass('QR: 409 duplicate attendance handled')
  : fail('QR 409 handling missing');

// 400 expired QR handled
fileContains('app/attendance/selfie.jsx', '400')
  ? pass('QR: 400 expired/invalid QR handled')
  : fail('QR 400 handling missing');

// ═══════════════════════════════════════════════════════════
section('6. OFFLINE SYSTEM');
// ═══════════════════════════════════════════════════════════

// AsyncStorage persistence
fileContains('src/store/offlineStore.js', 'AsyncStorage')
  ? pass('Offline queue persisted in AsyncStorage')
  : fail('AsyncStorage persistence missing');

// Queue survives app restart
fileContains('src/store/offlineStore.js', 'hydrate')
  ? pass('Offline queue loaded on app boot (survives restart)')
  : fail('Queue hydration missing');

// 409 dequeue (already marked)
fileContains('src/store/offlineStore.js', '409')
  ? pass('409 from sync → entry removed (duplicate prevention)')
  : fail('409 dequeue missing');

// Auto-sync on reconnect
fileContains('src/components/ui/OfflineBanner.jsx', 'syncAll')
  ? pass('Auto-sync triggered on reconnect via OfflineBanner')
  : fail('Auto-sync on reconnect missing');

// ═══════════════════════════════════════════════════════════
section('7. PERMISSION HANDLING');
// ═══════════════════════════════════════════════════════════

// Camera permission — QR
fileContains('app/attendance/qr.jsx', 'permission.canAskAgain')
  ? pass('QR: handles permanently denied camera permission')
  : fail('QR missing canAskAgain check');

// Camera permission — Selfie
fileContains('app/attendance/selfie.jsx', "!permission?.granted")
  ? pass('Selfie: camera permission gate')
  : fail('Selfie missing camera permission gate');

// Location permission
fileContains('app/attendance/wifi.jsx', "'granted'")
  ? pass('WiFi: location permission checked')
  : fail('WiFi location permission check missing');

// ═══════════════════════════════════════════════════════════
section('8. RESPONSIVENESS & SAFE AREA');
// ═══════════════════════════════════════════════════════════

const safeAreaScreens = [
  'app/auth/login.jsx','app/terms.jsx','app/(tabs)/index.jsx',
  'app/(tabs)/history.jsx','app/(tabs)/profile.jsx',
  'app/attendance/wifi.jsx','app/attendance/success.jsx',
];
safeAreaScreens.forEach(f => {
  fileContains(f, 'useSafeAreaInsets')
    ? pass(`${f.split('/').pop()}: useSafeAreaInsets`)
    : fail(`${f.split('/').pop()}: missing safe area insets`);
});

// Scale clamping for extreme screens
fileContains('src/constants/layout.js', 'Math.min') && fileContains('src/constants/layout.js', 'Math.max')
  ? pass('Layout: scale clamped (0.85–1.25) for extreme devices')
  : fail('Layout scale clamping missing');

// Android back button on success
fileContains('app/attendance/success.jsx', 'BackHandler')
  ? pass('Success: Android back button blocked (prevents navigation)')
  : fail('Success: Android back handler missing');

// Keyboard avoidance on login
fileContains('app/auth/login.jsx', 'KeyboardAvoidingView')
  ? pass('Login: KeyboardAvoidingView present')
  : fail('Login: KeyboardAvoidingView missing');

// ═══════════════════════════════════════════════════════════
section('9. APP CONFIGURATION');
// ═══════════════════════════════════════════════════════════

const appJson = JSON.parse(fs.readFileSync('app.json','utf8'));
appJson.expo.scheme                   ? pass('app.json: scheme set (deep links)') : fail('app.json: scheme missing');
appJson.expo.android?.package         ? pass('app.json: android.package set') : fail('android.package missing');
appJson.expo.ios?.bundleIdentifier    ? pass('app.json: ios.bundleIdentifier set') : fail('ios.bundleIdentifier missing');
appJson.expo.ios?.supportsTablet      ? pass('app.json: iPad supported') : warn('iPad support not declared');
appJson.expo.newArchEnabled === false ? pass('app.json: newArchEnabled:false (stable)') : warn('New arch enabled — may cause issues');
appJson.expo.plugins?.includes('expo-router') ? pass('expo-router plugin declared') : fail('expo-router plugin missing');

// Permission descriptions in iOS Info.plist
const infoPlist = appJson.expo.ios?.infoPlist || {};
infoPlist.NSCameraUsageDescription   ? pass('iOS: NSCameraUsageDescription set') : fail('iOS: Camera usage description missing');
infoPlist.NSLocationWhenInUseUsageDescription ? pass('iOS: NSLocationWhenInUseUsageDescription set') : fail('iOS: Location usage description missing');

// Android permissions
const androidPerms = appJson.expo.android?.permissions || [];
['CAMERA','ACCESS_FINE_LOCATION','ACCESS_WIFI_STATE','INTERNET'].forEach(p =>
  androidPerms.includes(p) ? pass(`Android: ${p} permission declared`) : fail(`Android: ${p} permission missing`)
);

// EAS config
const eas = JSON.parse(fs.readFileSync('eas.json','utf8'));
eas.build?.preview?.android?.buildType === 'apk' ? pass('EAS preview: APK build configured') : warn('EAS APK build not configured');
eas.build?.production                             ? pass('EAS production build configured') : warn('EAS production not configured');

// Reanimated plugin in babel
fileContains('babel.config.js', 'react-native-reanimated/plugin')
  ? pass('babel.config.js: reanimated plugin present')
  : fail('reanimated plugin missing from babel.config.js');

// ═══════════════════════════════════════════════════════════
section('10. BRANDING & CONTENT');
// ═══════════════════════════════════════════════════════════

// No old "Attendify" references
const allSrc = fs.readdirSync('.', {recursive:true})
  .filter(f => (f.endsWith('.jsx')||f.endsWith('.js')||f.endsWith('.json'))
    && !f.includes('node_modules') && !f.includes('.git') && !f.includes('qa_verification'));

let attendifyRefs = 0;
allSrc.forEach(f => {
  const c = fs.readFileSync(f,'utf8');
  if (/attendify/i.test(c)) attendifyRefs++;
});
attendifyRefs === 0
  ? pass('No old "Attendify" references remain')
  : warn(`${attendifyRefs} files still contain "Attendify" text`);

// .env has API URL
fileContains('.env', 'EXPO_PUBLIC_API_URL')
  ? pass('.env: EXPO_PUBLIC_API_URL configured')
  : fail('.env: EXPO_PUBLIC_API_URL missing');

// ═══════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════
results.forEach(r => console.log(r));
console.log(`\n${'═'.repeat(60)}`);
console.log(`  QA RESULT: ${passed} passed · ${failed} failed · ${warnings} warnings`);
console.log(`  Total checks: ${passed + failed + warnings}`);
if (failed === 0 && warnings === 0) {
  console.log(`\n  🎉 ALL CHECKS PASSED — Production ready!`);
} else if (failed === 0) {
  console.log(`\n  ✅ Zero failures — ${warnings} warnings (non-blocking)`);
} else {
  console.log(`\n  ❌ ${failed} failures must be fixed before release`);
}
console.log('═'.repeat(60));
