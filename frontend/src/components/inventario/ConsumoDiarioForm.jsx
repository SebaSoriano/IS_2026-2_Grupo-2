import { useEffect, useRef, useState } from 'react'
import { crearConsumoDiario } from '../../services/api.js'
import HistorialInsumos from '../historialMedico/HistorialInsumos.jsx'
import '../animales/AnimalForm.css'
import '../historialMedico/HistorialForm.css'
import './ConsumoDiarioForm.css'

export default function ConsumoDiarioForm({ isOpen, onClose, onSaved }) {
  const [insumos, setInsumos] = useState([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function cerrar() {
    if (!enviando) onClose()
  }

  async function enviar(event) {
    event.preventDefault()
    setError('')

    if (insumos.length === 0) {
      setError('Agrega al menos un insumo para registrar el consumo diario.')
      return
    }

    setEnviando(true)
    try {
      await crearConsumoDiario(insumos.map(({ id_insumo, cantidad }) => ({
        id_insumo,
        cantidad: cantidad == null ? null : Number(cantidad),
      })))
      onSaved()
    } catch (requestError) {
      const mensajes = requestError.details?.map(({ mensaje }) => mensaje).filter(Boolean)
      setError(mensajes?.length ? mensajes.join('. ') : requestError.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog
      className="animal-dialog historial-dialog consumo-diario-dialog"
      ref={dialogRef}
      aria-labelledby="consumo-diario-title"
      onCancel={(event) => {
        event.preventDefault()
        cerrar()
      }}
      onClose={() => {
        if (isOpen && !enviando) onClose()
      }}
    >
      <form className="animal-form consumo-diario-form" onSubmit={enviar}>
        <div className="animal-dialog-header">
          <h2 id="consumo-diario-title">Registrar consumo diario</h2>
          <button
            className="animal-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={cerrar}
            disabled={enviando}
          >
            ×
          </button>
        </div>

        <p className="consumo-diario-form__ayuda">
          Registra los insumos utilizados durante el día. Los insumos por cantidad se descuentan ahora;
          los envases se descuentan cuando se marcan como terminados.
        </p>

        {error && <p className="animal-form__error" role="alert">{error}</p>}

        <fieldset className="historial-form__insumos">
          <legend>Insumos utilizados</legend>
          <HistorialInsumos
            elegidos={insumos}
            onChange={(nuevosInsumos) => {
              setInsumos(nuevosInsumos)
              setError('')
            }}
            mensajeVacio="Agrega al menos un insumo para poder guardar este registro."
          />
        </fieldset>

        <div className="animal-form__actions">
          <button
            className="animal-form__cancel"
            type="button"
            onClick={cerrar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button className="animal-form__submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar consumo diario'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
