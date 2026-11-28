import { useEffect, useState } from 'react'
import { enviarSolicitudAdopcion, getAnimalParaAdoptar } from '../../services/api.js'
import { SEXOS_ANIMAL, TIPOS_VIVIENDA } from '../../data/estados.js'
import './AdoptionRequestPage.css'

// Campos del formulario: los datos de la tabla "adoptante"
const formularioVacio = {
  nombre_adoptante: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  tipo_vivienda: '',
  observaciones_adoptante: '',
}

// Fecha de hoy como AAAA-MM-DD (para no dejar elegir una fecha de nacimiento futura)
function fechaDeHoy() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

// Página pública /adoptar?animal=5
// La abre el botón "Quiero adoptar" de la página principal. Muestra el animal elegido
// y un formulario con los datos del adoptante. No pide iniciar sesión.
export default function AdoptionRequestPage() {
  // El id del animal viene en la URL: /adoptar?animal=5 → 5
  const idAnimal = Number(new URLSearchParams(window.location.search).get('animal'))

  const [animal, setAnimal] = useState(null)
  // 'cargando', 'listo' o 'error' (el animal no existe o ya no está disponible)
  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState('')
  const [formulario, setFormulario] = useState(formularioVacio)
  const [errores, setErrores] = useState({})
  const [mensajeError, setMensajeError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)

  // Al abrir la página se piden los datos del animal
  useEffect(() => {
    if (!idAnimal) {
      setErrorCarga('No se indicó qué animal quieres adoptar.')
      setEstado('error')
      return
    }
    getAnimalParaAdoptar(idAnimal)
      .then((datos) => {
        setAnimal(datos)
        setEstado('listo')
      })
      .catch((error) => {
        setErrorCarga(error.message)
        setEstado('error')
      })
  }, [idAnimal])

  function cambiarCampo(event) {
    setFormulario({ ...formulario, [event.target.name]: event.target.value })
  }

  async function enviar(event) {
    event.preventDefault()
    setErrores({})
    setMensajeError('')
    setEnviando(true)

    const datos = {
      id_animal: idAnimal,
      nombre_adoptante: formulario.nombre_adoptante,
      direccion: formulario.direccion,
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim(),
      fecha_nacimiento: formulario.fecha_nacimiento,
      tipo_vivienda: formulario.tipo_vivienda,
    }
    if (formulario.observaciones_adoptante.trim() !== '') {
      datos.observaciones_adoptante = formulario.observaciones_adoptante
    }

    try {
      await enviarSolicitudAdopcion(datos)
      setEnviada(true)
    } catch (error) {
      if (error.details && error.details.length > 0) {
        const erroresPorCampo = {}
        for (const detalle of error.details) {
          erroresPorCampo[detalle.campo] = detalle.mensaje
        }
        setErrores(erroresPorCampo)
        setMensajeError('Revisa los campos marcados')
      } else {
        // ej: 409 "El animal no está disponible para adopción", o el servidor no responde
        setMensajeError(error.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="adoptar">
      <header className="adoptar__header">
        <img className="adoptar__logo" src="/logo_straypaws.png" alt="Stray Paws" />
        <a className="adoptar__volver" href="/">← Volver al inicio</a>
      </header>

      {estado === 'cargando' && <p role="status">Cargando...</p>}

      {estado === 'error' && (
        <section className="adoptar__tarjeta">
          <h1>No se puede adoptar este animal</h1>
          <p>{errorCarga}</p>
          <a className="adoptar__boton" href="/">Ver otros animales</a>
        </section>
      )}

      {estado === 'listo' && enviada && (
        <section className="adoptar__tarjeta">
          <h1>¡Gracias por querer adoptar a {animal.nombre_animal}!</h1>
          <p>
            Recibimos tu solicitud. El refugio la revisará y te contactará para coordinar
            una visita.
          </p>
          <a className="adoptar__boton" href="/">Volver al inicio</a>
        </section>
      )}

      {estado === 'listo' && !enviada && (
        <section className="adoptar__tarjeta">
          <div className="adoptar__animal">
            {animal.foto_animal && (
              <img
                className="adoptar__foto"
                src={animal.foto_animal}
                alt={`Foto de ${animal.nombre_animal}`}
              />
            )}
            <div>
              <h1>Quiero adoptar a {animal.nombre_animal}</h1>
              <p>
                {animal.especie_animal}
                {animal.sexo_animal && ` · ${SEXOS_ANIMAL[animal.sexo_animal]}`}
                {' · '}{animal.edad === 0 ? 'Menos de 1 año' : `${animal.edad} años`}
              </p>
            </div>
          </div>

          <form className="adoptar__formulario" onSubmit={enviar}>
            {mensajeError && <p className="adoptar__error" role="alert">{mensajeError}</p>}

            <label className="adoptar__campo">
              Nombre completo
              <input name="nombre_adoptante" value={formulario.nombre_adoptante} onChange={cambiarCampo}
                minLength={2} maxLength={100} autoComplete="name" required />
              {errores.nombre_adoptante && <span className="adoptar__error">{errores.nombre_adoptante}</span>}
            </label>

            <label className="adoptar__campo">
              Dirección
              <input name="direccion" value={formulario.direccion} onChange={cambiarCampo}
                minLength={5} maxLength={200} autoComplete="street-address" required />
              {errores.direccion && <span className="adoptar__error">{errores.direccion}</span>}
            </label>
                      
            <label className="adoptar__campo">
              Tipo de vivienda
              <select name="tipo_vivienda" value={formulario.tipo_vivienda} onChange={cambiarCampo} required>
                <option value="">Selecciona una opción</option>
                {Object.entries(TIPOS_VIVIENDA).map(([valor, texto]) => (
                  <option value={valor} key={valor}>{texto}</option>
                ))}
              </select>
              {errores.tipo_vivienda && <span className="adoptar__error">{errores.tipo_vivienda}</span>}
            </label>

            <label className="adoptar__campo">
              Teléfono
              <input name="telefono" type="tel" value={formulario.telefono} onChange={cambiarCampo}
                placeholder="+56912345678" autoComplete="tel" required />
              {errores.telefono && <span className="adoptar__error">{errores.telefono}</span>}
            </label>

            <label className="adoptar__campo">
              Correo electrónico
              <input name="correo" type="email" value={formulario.correo} onChange={cambiarCampo}
                maxLength={100} autoComplete="email" required />
              {errores.correo && <span className="adoptar__error">{errores.correo}</span>}
            </label>

            <label className="adoptar__campo">
              Fecha de nacimiento
              <input name="fecha_nacimiento" type="date" value={formulario.fecha_nacimiento}
                onChange={cambiarCampo} max={fechaDeHoy()} required />
              {errores.fecha_nacimiento && <span className="adoptar__error">{errores.fecha_nacimiento}</span>}
            </label>

            <label className="adoptar__campo">
              Cuéntanos por qué quieres adoptar (opcional)
              <textarea name="observaciones_adoptante" value={formulario.observaciones_adoptante}
                onChange={cambiarCampo} rows={3} maxLength={500} />
              {errores.observaciones_adoptante && (
                <span className="adoptar__error">{errores.observaciones_adoptante}</span>
              )}
            </label>

            <button className="adoptar__boton" type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </section>
      )}
    </main>
  )
}