export function isDesktopEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    navigator.userAgent.toLowerCase().includes('electron') ||
    'electron' in window ||
    '__TAURI__' in window ||
    (typeof process !== 'undefined' && Boolean((process as any)?.versions?.electron))
  );
}

export function isMacDesktopEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const isMac = (
    navigator.userAgent.toLowerCase().includes('macintosh') ||
    navigator.userAgent.toLowerCase().includes('mac os x') ||
    (typeof navigator.platform === 'string' && navigator.platform.toLowerCase().includes('mac'))
  );
  return isDesktopEnvironment() && isMac;
}
