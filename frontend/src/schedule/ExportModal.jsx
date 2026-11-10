import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAsistencias, getHorarios } from '../services/api.js'
import HojaImpresion from './HojaImpresion.jsx'
import Modal from './Modal.jsx'
import MonthPicker from './MonthPicker.jsx'
import WeekPicker from './WeekPicker.jsx'
import { describirSemana, nombreDelMes, sumarDias } from './calendario.js'

const OPCIONES = [
  { tipo: 'horario-semanal', titulo: 'Horario semanal', detalle: 'Turnos de una semana, hora por hora.' },
  { tipo: 'horario-mensual', titulo: 'Horario mensual', detalle: 'Calendario del mes con los turnos de cada día.' },
  { tipo: 'asistencia-semanal', titulo: 'Asistencia semanal', detalle: 'Quién llegó a la hora a sus turnos de la semana.' },
]

// pide a la API los datos de lo que se va a imprimir
async function cargarDatos(tipo, semana, mes) {
  if (tipo === 'horario-semanal') return getHorarios(semana)
  if (tipo === 'horario-mensual') return getAsistencias(mes)

  // asistencia semanal: la semana puede cruzar de mes, se piden los dos y se juntan los turnos de cada persona
  const meses = [...new Set([semana.slice(0, 7), sumarDias(semana, 6).slice(0, 7)])]
  const respuestas = await Promise.all(meses.map(getAsistencias))
  const porRut = new Map()
  for (const usuario of respuestas.flat()) {
    const previo = porRut.get(usuario.rut_usuario)
    porRut.set(usuario.rut_usuario, previo ? { ...previo, turnos: [...previo.turnos, ...usuario.turnos] } : usuario)
  }
  return [...porRut.values()]
}

// pop-up de Exportar: se elige que imprimir (horario semanal o mensual, o asistencia semanal) y su periodo
// al imprimir se arma una hoja aparte (HojaImpresion) que es lo unico que sale en el papel o en el PDF
// parte en lo que se esta viendo en el horario: tipoInicial, semanaInicial ("AAAA-MM-DD" del lunes) y mesInicial ("AAAA-MM")
export default function ExportModal({ tipoInicial = 'horario-semanal', semanaInicial, mesInicial, onClose }) {
  const [tipo, setTipo] = useState(tipoInicial)
  const [semana, setSemana] = useState(semanaInicial)
  const [mes, setMes] = useState(mesInicial)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  // hoja lista para imprimir: { tipo, semana, mes, datos }
  const [impresion, setImpresion] = useState(null)

  // con la hoja ya en la pagina se abre el dialogo de impresion; al cerrarlo se quita la hoja
  // mientras se imprime, el titulo de la pestaña describe la hoja: es el nombre que el navegador propone al guardar el PDF
  useEffect(() => {
    if (!impresion) return undefined
    const tituloOriginal = document.title
    const periodo = impresion.tipo === 'horario-mensual' ? nombreDelMes(impresion.mes) : describirSemana(impresion.semana)
    document.title = `${OPCIONES.find((opcion) => opcion.tipo === impresion.tipo).titulo} - ${periodo.replace(' · ', ' ')}`
    document.body.classList.add('imprimiendo')
    const terminar = () => setImpresion(null)
    window.addEventListener('afterprint', terminar)
    const frame = requestAnimationFrame(() => window.print())
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', terminar)
      document.body.classList.remove('imprimiendo')
      document.title = tituloOriginal
    }
  }, [impresion])

  const imprimir = async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await cargarDatos(tipo, semana, mes)
      setImpresion({ tipo, semana, mes, datos })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Modal title="Exportar" onClose={onClose}>
      <div className="turno-form">
        <fieldset className="export-options">
          <legend className="turno-form__label">¿Qué quieres exportar?</legend>
          {OPCIONES.map((opcion) => (
            <label key={opcion.tipo} className={`export-option${tipo === opcion.tipo ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="tipo-exportar"
                value={opcion.tipo}
                checked={tipo === opcion.tipo}
                onChange={() => setTipo(opcion.tipo)}
              />
              <span className="export-option__titulo">{opcion.titulo}</span>
              <small>{opcion.detalle}</small>
            </label>
          ))}
        </fieldset>

        <div>
          <span className="turno-form__label">{tipo === 'horario-mensual' ? 'Mes' : 'Semana'}</span>
          <div className="export-periodo">
            {tipo === 'horario-mensual' ? (
              <MonthPicker mes={mes} onChange={setMes} />
            ) : (
              <WeekPicker lunes={semana} onChange={setSemana} />
            )}
          </div>
        </div>

        <p className="turno-form__summary">
          Se abrirá la ventana de impresión en hoja horizontal. Puedes imprimir directo o elegir
          «Guardar como PDF».
        </p>

        {error && <p className="turno-form__error" role="alert">No se pudo preparar la exportación: {error}</p>}

        <div className="modal__actions">
          <button type="button" className="modal__button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="modal__button modal__button--primary" onClick={imprimir} disabled={cargando}>
            {cargando ? 'Preparando...' : 'Imprimir'}
          </button>
        </div>
      </div>

      {impresion && createPortal(<HojaImpresion {...impresion} />, document.body)}
    </Modal>
  )
}
