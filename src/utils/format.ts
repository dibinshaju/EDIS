export function formatFlow(litersPerMinute: number): string {
  if (isNaN(litersPerMinute) || !isFinite(litersPerMinute)) return '0.0';
  return litersPerMinute.toFixed(1);
}

export function formatVolume(liters: number): string {
  if (isNaN(liters) || liters < 0) return '0 L';
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(2)} m³`;
  }
  return `${liters.toFixed(1)} L`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return '+91 ••••• •••••';
  const clean = phone.trim();
  const visiblePrefix = clean.slice(0, 3); // e.g. +91
  const startDigits = clean.slice(3, 7); // e.g. 9876
  return `${visiblePrefix} ${startDigits} •••••`;
}
