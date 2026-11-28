// Textos para los estados de salud que calcula el backend (config/saludPublica.js y saludPublica.service.js)
// verde = al día, amarillo = por vencer, rojo = vencida, gris = sin registro en el hogar
export const ESTADOS_SALUD = {
  al_dia: { texto: 'Al día', clase: 'estado-salud--al-dia' },
  por_vencer: { texto: 'Por vencer', clase: 'estado-salud--por-vencer' },
  vencida: { texto: 'Vencida', clase: 'estado-salud--vencida' },
  sin_registro: { texto: 'Sin registro', clase: 'estado-salud--sin-registro' },
}

// En el catálogo las vacunas se ponen en mayúscula la primera letra
export function nombreCortoVacuna(nombre) {
  const sinVacuna = nombre.replace(/^vacuna\s+/i, '')
  return sinVacuna.charAt(0).toUpperCase() + sinVacuna.slice(1)
}