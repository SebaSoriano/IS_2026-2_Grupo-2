import { useEffect, useState } from 'react'
import { getEstadisticasDonaciones } from '../services/api.js'
import './DonationStats.css'

const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })

// Un ranking en barras horizontales. Cada barra mide su valor respecto al mayor de la lista
function Ranking({ titulo, nota, filas, valorDe, formato, vacio }) {
  const maximo = Math.max(...filas.map(valorDe), 0)

  return (
    <section className="donation-ranking" aria-label={titulo}>
      <h3>{titulo}</h3>
      <p className="donation-ranking__nota">{nota}</p>
      {filas.length === 0 ? (
        <p className="donation-ranking__vacio">{vacio}</p>
      ) : (
        <ol className="donation-ranking__lista">
          {filas.map((fila, indice) => {
            const valor = valorDe(fila)
            return (
              <li key={`${fila.nombre}-${indice}`} title={`${fila.nombre}: ${formato(valor)}`}>
                <span className="donation-ranking__nombre">{fila.nombre}</span>
                <span className="donation-ranking__pista" aria-hidden="true">
                  <span
                    className="donation-ranking__barra"
                    style={{ width: `${maximo > 0 ? (valor / maximo) * 100 : 0}%` }}
                  />
                </span>
                <span className="donation-ranking__valor">{formato(valor)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// recarga cambia cada vez que se agenda, confirma, edita o elimina algo: así los rankings se actualizan
export default function DonationStats({ recarga }) {
  const [datos, setDatos] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let esVigente = true

    getEstadisticasDonaciones()
      .then((respuesta) => {
        if (!esVigente) return
        setDatos(respuesta)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!esVigente) return
        setError(requestError.message)
        setStatus('error')
      })

    return () => {
      esVigente = false
    }
  }, [recarga])

  return (
    <div className="inventory-table-container donation-estadisticas" aria-busy={status === 'loading'}>
      <h2>Estadísticas de donaciones</h2>
      {status === 'loading' && <p role="status">Cargando estadísticas...</p>}
      {status === 'error' && (
        <p className="inventory-error" role="alert">
          No se pudieron cargar las estadísticas: {error}
        </p>
      )}
      {status === 'success' && (
        <div className="donation-estadisticas__rankings">
          <Ranking
            titulo="Quienes más han donado (monto)"
            nota="Suma de las donaciones en dinero confirmadas."
            filas={datos.porMonto}
            valorDe={(fila) => fila.total}
            formato={(valor) => formatoPesos.format(valor)}
            vacio="Todavía no hay donaciones en dinero confirmadas."
          />
          <Ranking
            titulo="Quienes más han donado (cantidad)"
            nota="Número de donaciones confirmadas, en dinero o insumos."
            filas={datos.porCantidad}
            valorDe={(fila) => fila.cantidad}
            formato={(valor) => `${valor} ${valor === 1 ? 'donación' : 'donaciones'}`}
            vacio="Todavía no hay donaciones confirmadas."
          />
        </div>
      )}
      <p className="donation-estadisticas__aviso">
        Solo cuentan las donaciones confirmadas. Se agrupa por correo o, si no hay, por nombre;
        las donaciones sin datos del donante no aparecen.
      </p>
    </div>
  )
}