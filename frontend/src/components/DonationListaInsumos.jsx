import { Campo } from './DonationFormPartes.jsx'
import './DonationForm.css'

const TIPOS_INSUMO = [
  'Alimentación',
  'Higiene y aseo',
  'Salud',
  'Limpieza',
  'Accesorios y juguetes',
  'Otros',
]

// Dibuja la lista de insumos. "lista" es lo que devuelve useListaInsumos()
export default function DonationListaInsumos({ lista }) {
  const { filas, cambiar, agregar, quitar, estaLlena } = lista

  return (
    <>
      {filas.map((fila, indice) => (
        <fieldset className="donation-insumo" key={fila.id}>
          <legend>Insumo {indice + 1}</legend>

          <Campo etiqueta="Tipo">
            <select
              value={fila.tipo_insumo}
              onChange={(event) => cambiar(indice, 'tipo_insumo', event.target.value)}
              required
            >
              <option value="">Elige un tipo</option>
              {TIPOS_INSUMO.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Cantidad">
            <input
              type="number"
              min="1"
              max="99"
              step="1"
              value={fila.cantidad}
              onChange={(event) => cambiar(indice, 'cantidad', event.target.value)}
              required
            />
          </Campo>

          <Campo etiqueta="Descripción (opcional)">
            <input
              value={fila.descripcion}
              maxLength={255}
              onChange={(event) => cambiar(indice, 'descripcion', event.target.value)}
            />
          </Campo>

          <Campo etiqueta="Vencimiento (opcional)">
            <input
              type="date"
              value={fila.fecha_vencimiento}
              onChange={(event) => cambiar(indice, 'fecha_vencimiento', event.target.value)}
            />
          </Campo>

          {filas.length > 1 && (
            <button type="button" className="modal__button modal__button--danger" onClick={() => quitar(indice)}>
              Quitar
            </button>
          )}
        </fieldset>
      ))}

      <button type="button" className="modal__button" onClick={agregar} disabled={estaLlena}>
        + Agregar otro insumo
      </button>
    </>
  )
}