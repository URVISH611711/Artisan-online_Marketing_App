/**
 * Image helper utility for React Native <Image /> components.
 * Automatically attaches LocalTunnel bypass headers so image URLs
 * served over LocalTunnel bypass the reminder landing page.
 */
export function getImageSource(url?: string | null) {
  if (!url) return undefined;
  if (url.includes('loca.lt') || url.includes('localtunnel')) {
    return {
      uri: url,
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
        'bypass-tunnel-reminder': 'true',
      },
    };
  }
  return { uri: url };
}
