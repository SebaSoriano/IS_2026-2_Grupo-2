// Textos para mostrar los estados que vienen del backend.
// Las claves son los valores de los enum EstadoAnimal y EstadoSolicitud de schema.prisma.

export const ESTADOS_ANIMAL = {
  disponible: 'Disponible',
  en_proceso: 'En proceso de adopción',
  adoptado: 'Adoptado',
  fallecido: 'Fallecido',
}

export const ESTADOS_SOLICITUD = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  rechazada: 'Rechazada',
  adoptada: 'Adoptada',
}