// Reglas de las solicitudes de adopción que se usan en más de un archivo

// Un animal puede tener como máximo 3 solicitudes abiertas a la vez
export const MAXIMO_SOLICITUDES = 3;

// Las solicitudes "abiertas" son las que ocupan un cupo.
// Las rechazadas y las adoptadas ya no cuentan: así se libera el cupo.
export const ESTADOS_ABIERTOS = ['pendiente', 'en_proceso'];