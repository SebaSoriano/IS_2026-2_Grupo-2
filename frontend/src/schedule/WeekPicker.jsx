import { describirSemana, sumarDias } from './calendario.js'

// selector de semana con flechas: muestra "Semana 3 de octubre · 12 al 18"
// lunes es la semana elegida ("AAAA-MM-DD" de su lunes)
// minimo (opcional) es la primera semana permitida, la flecha hacia atras se bloquea al llegar a ella
export default function WeekPicker({ lunes, onChange, minimo }) {
  const enElMinimo = minimo != null && lunes <= minimo

  return (
    <div className="week-picker">
      <button
        type="button"
        onClick={() => onChange(sumarDias(lunes, -7))}
        disabled={enElMinimo}
        aria-label="Semana anterior"
        title={enElMinimo ? 'No se puede ir a semanas anteriores' : 'Semana anterior'}
      >
        ‹
      </button>
      <span aria-live="polite">{describirSemana(lunes)}</span>
      <button type="button" onClick={() => onChange(sumarDias(lunes, 7))} aria-label="Semana siguiente" title="Semana siguiente">
        ›
      </button>
    </div>
  )
}
