import { useEffect, useState } from 'react'
import './AnimalSaludPublica.css'
import EstadoSalud from './EstadoSalud.jsx'
import { getSaludAnimalPublico } from '../../services/api.js'
import { formatearFecha } from '../../utils/fechas.js'
import { nombreCortoVacuna } from '../../data/saludPublica.js'

// Texto chico que acompaña a cada vacuna o desparasitación según su estado.
// Si no hay registro devuelve null (no se muestra nada abajo): la pastilla "Sin registro" ya lo dice.
function detalleVigencia(item) {
  if (item.estado === 'al_dia') return `Vigente hasta el ${formatearFecha(item.vence)}`
  if (item.estado === 'por_vencer') return `Vence pronto, el ${formatearFecha(item.vence)}`
  if (item.estado === 'vencida') return `Venció el ${formatearFecha(item.vence)}`
  return null
}

// Estado de algo que se hace una sola vez (esterilización, microchip): "Sí" o "No".
// Usa los mismos colores que EstadoSalud: verde para "Sí" y gris para "No".
function EstadoSiNo({ valor }) {
  return valor
    ? <span className="estado-salud estado-salud--al-dia">Sí</span>
    : <span className="estado-salud estado-salud--sin-registro">No</span>
}

// Una fila de la lista: nombre a la izquierda, estado a la derecha y, si hay, un detalle abajo
function FilaSalud({ titulo, estado, detalle }) {
  return (
    <li className="salud-publica__fila">
      <div className="salud-publica__fila-principal">
        <span>{titulo}</span>
        {estado}
      </div>
      {detalle && <p className="salud-publica__detalle">{detalle}</p>}
    </li>
  )
}

// Resumen de salud que se ve dentro del "Ver detalles" de la página pública.
// Recibe el animal que se está mirando y pide su resumen al backend al abrirse.
export default function AnimalSaludPublica({ animal }) {
  const [salud, setSalud] = useState(null)
  const [estadoCarga, setEstadoCarga] = useState('cargando')

  useEffect(() => {
    // "cancelado" evita guardar la respuesta si el pop-up se cerró antes de que llegara
    let cancelado = false

    async function cargarSalud() {
      try {
        const respuesta = await getSaludAnimalPublico(animal.id_animal)
        if (cancelado) return
        setSalud(respuesta)
        setEstadoCarga('listo')
      } catch {
        if (cancelado) return
        setEstadoCarga('error')
      }
    }

    cargarSalud()
    return () => {
      cancelado = true
    }
  }, [animal.id_animal])

  if (estadoCarga === 'cargando') {
    return <p className="salud-publica__mensaje" role="status">Cargando información de salud...</p>
  }

  if (estadoCarga === 'error') {
    return (
      <p className="salud-publica__mensaje" role="alert">
        No se pudo cargar la información de salud. Puedes preguntarnos por ella al postular.
      </p>
    )
  }

  // La palabra cambia según el sexo: a los machos se les castra y a las hembras se les esteriliza
  const textoEsterilizado = salud.sexo_animal === 'hembra' ? 'Esterilizada' : 'Castrado'

  return (
    <section className="salud-publica" aria-labelledby="salud-publica-titulo">
      <h3 id="salud-publica-titulo">Salud</h3>

      {/* Cada vacuna por separado: primero las obligatorias de su especie y después las opcionales que tenga */}
      <h4 className="salud-publica__subtitulo">Vacunas</h4>
      <ul className="salud-publica__lista">
        {salud.vacunas.map((vacuna) => (
          <FilaSalud
            key={vacuna.nombre}
            titulo={nombreCortoVacuna(vacuna.nombre)}
            estado={<EstadoSalud estado={vacuna.estado} />}
            detalle={detalleVigencia(vacuna)}
          />
        ))}
      </ul>

      <h4 className="salud-publica__subtitulo">Otros cuidados</h4>
      <ul className="salud-publica__lista">
        {salud.desparasitaciones.map((desparasitacion) => (
          <FilaSalud
            key={desparasitacion.tipo}
            titulo={`Desparasitación ${desparasitacion.tipo.toLowerCase()}`}
            estado={<EstadoSalud estado={desparasitacion.estado} />}
            detalle={detalleVigencia(desparasitacion)}
          />
        ))}
        <FilaSalud titulo={textoEsterilizado} estado={<EstadoSiNo valor={salud.esterilizado.valor} />} />
        <FilaSalud titulo="Microchip" estado={<EstadoSiNo valor={salud.microchip.valor} />} />
        <FilaSalud
          titulo="Última atención veterinaria"
          estado={
            <span className="salud-publica__fecha">
              {salud.ultima_atencion ? formatearFecha(salud.ultima_atencion) : 'Sin registro'}
            </span>
          }
        />
      </ul>

      <p className="salud-publica__nota">
        Según los registros médicos del hogar. Si tienes dudas sobre su salud, pregúntanos al postular.
      </p>
    </section>
  )
}