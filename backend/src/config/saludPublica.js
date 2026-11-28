// - vigenciaDias: cuántos días dura la protección
// - especies: a qué especies se les revisa
// - obligatoria: sin ella el animal no queda con las vacunas al día
//   las que no son obligatorias solo se muestran cuando el animal las tiene
export const VACUNAS = [
  { nombre: 'Vacuna Antirrábica', vigenciaDias: 365, especies: 'todas', obligatoria: true },
  { nombre: 'Vacuna Óctuple', vigenciaDias: 365, especies: ['perro'], obligatoria: true },
  { nombre: 'Vacuna triple felina', vigenciaDias: 365, especies: ['gato'], obligatoria: true },
  { nombre: 'Vacuna leucemia felina', vigenciaDias: 365, especies: ['gato'], obligatoria: false },
  { nombre: 'Vacuna tos de las perreras', vigenciaDias: 365, especies: ['perro'], obligatoria: false },
];

// Desparasitaciones: la interna cada 3 meses y la externa cada mes
export const DESPARASITACIONES = [
  { tipo: 'Interna', nombre: 'Desparasitación', vigenciaDias: 90 },
  { tipo: 'Externa', nombre: 'Desparasitación externa (pulgas y garrapatas)', vigenciaDias: 30 },
];

// Cualquiera de estos procedimientos cuenta como que el animal ya está esterilizado
// (en el catálogo existen los dos nombres: "Castración" en machos y "Esterilización" en hembras)
export const ESTERILIZACION = ['Esterilización', 'Castración'];

// Procedimiento que indica que el animal tiene microchip
export const MICROCHIP = ['Implantación de microchip'];

// Cuántos días antes de vencer una vacuna o desparasitación pasa a mostrarse como "Por vencer".
export const DIAS_AVISO_POR_VENCER = 15;