import './EstadoSalud.css'
import { ESTADOS_SALUD } from '../../data/saludPublica.js'

// Pastilla de color con el estado de una vacuna o desparasitación
// Recibe el estado tal como lo manda el backend ('al_dia', 'por_vencer', 'vencida' o 'sin_registro').
// Se usa en la tarjeta de cada animal y en el "Ver detalles" de la página pública.
export default function EstadoSalud({ estado }) {
  const { texto, clase } = ESTADOS_SALUD[estado] ?? ESTADOS_SALUD.sin_registro
  return <span className={`estado-salud ${clase}`}>{texto}</span>
}