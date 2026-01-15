/**
 * Helper para obtener el nombre completo de un perfil
 * La tabla profiles usa first_name y last_name en lugar de full_name
 */
export function getFullName(profile: any): string {
  if (!profile) return 'Sin nombre';
  
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Sin nombre';
}
