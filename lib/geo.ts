export async function getCountryFromIP(ip: string): Promise<string> {
  // Version simple (à améliorer avec une vraie API)
  if (ip.includes('ci') || ip.startsWith('197.')) return 'CI';
  if (ip.includes('sn') || ip.startsWith('41.')) return 'SN';
  if (ip.includes('cm') || ip.startsWith('165.')) return 'CM';
  
  return 'CI'; // Défaut
}