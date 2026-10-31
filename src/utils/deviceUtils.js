/**
 * Detects the current device type based on navigator.userAgent.
 * Returns one of: 'MOBILE' | 'TABLET' | 'DESKTOP'
 *
 * Used in the login payload so the backend session records the real device.
 */
export function getDeviceType() {
  const ua = navigator.userAgent;

  // Tablets — check before mobile (iPads report as mobile on some OS versions)
  const isTablet =
    /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua);

  // Mobile phones
  const isMobile =
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua);

  if (isTablet) return 'KITCHEN_TABLET';
  if (isMobile) return 'CAPTAIN_APP';
  return 'DESKTOP';
}
