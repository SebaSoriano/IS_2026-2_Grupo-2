import { moverMes, nombreDelMes } from './calendario.js'

// selector de mes con flechas: muestra "Noviembre 2026"
// mes es el mes elegido ("AAAA-MM"); usa los mismos estilos que el selector de semana
export default function MonthPicker({ mes, onChange }) {
  return (
    <div className="week-picker">
      <button type="button" onClick={() => onChange(moverMes(mes, -1))} aria-label="Mes anterior" title="Mes anterior">
        ‹
      </button>
      <span aria-live="polite">{nombreDelMes(mes)}</span>
      <button type="button" onClick={() => onChange(moverMes(mes, 1))} aria-label="Mes siguiente" title="Mes siguiente">
        ›
      </button>
    </div>
  )
}
