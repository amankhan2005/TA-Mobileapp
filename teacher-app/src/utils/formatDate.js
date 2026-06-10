export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
export const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
export const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function formatDateLong(dateStr) {
  // dateStr = 'YYYY-MM-DD'
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatDateDisplay(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTime(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
