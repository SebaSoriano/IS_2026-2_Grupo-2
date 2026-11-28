// Textos para mostrar los estados que vienen del backend.
// Las claves son los valores de los enum EstadoAnimal y EstadoSolicitud de schema.prisma.

export const ESTADOS_ANIMAL = {
  disponible: 'Disponible',
  en_proceso: 'En proceso de adopción',
  adoptado: 'Adoptado',
  fallecido: 'Fallecido',
}

// Textos para el enum SexoAnimal de schema.prisma
export const SEXOS_ANIMAL = {
  macho: 'Macho',
  hembra: 'Hembra',
}

// Textos para el enum TipoVivienda de schema.prisma
export const TIPOS_VIVIENDA = {
  casa: 'Casa',
  departamento: 'Departamento',
}

export const ESTADOS_SOLICITUD = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  rechazada: 'Rechazada',
  adoptada: 'Adoptada',
}