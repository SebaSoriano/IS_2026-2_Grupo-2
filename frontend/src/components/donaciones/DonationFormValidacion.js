// La API responde los errores como [{ campo, mensaje }]; esto los convierte en { campo: mensaje }
export function erroresPorCampo(error) {
  return Object.fromEntries((error.details ?? []).map(({ campo, mensaje }) => [campo, mensaje]))
}

// Los campos opcionales vacíos NO se envían: un teléfono "" fallaría la validación del backend
export const sinVacios = (objeto) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== ''))

const TIPOS_COMPROBANTE = ['image/jpeg', 'image/png']
const TAMANO_MAXIMO_COMPROBANTE = 5 * 1024 * 1024 // 5 MB, igual que el servidor

// Comodidad para el usuario: el servidor vuelve a validar todo igual
export function errorDeArchivo(archivo) {
  if (!archivo) return ''
  if (!TIPOS_COMPROBANTE.includes(archivo.type)) return 'Debe ser una imagen JPG o PNG'
  if (archivo.size > TAMANO_MAXIMO_COMPROBANTE) return 'El archivo no puede superar los 5 MB'
  return ''
}