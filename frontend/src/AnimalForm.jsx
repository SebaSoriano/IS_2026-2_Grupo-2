import { useState } from 'react';
import { crearAnimal } from './services/api.js'

// Parte el formulario vacío
const formularioVacio = {
  especie_animal: '',
  via_ingreso: '',
  edad: '',
  peso_animal: '',
  observaciones_animal: '',
};

// Entrega opciones para via de ingreso
const viasDeIngreso = ['Rescate', 'Abandono', 'Entrega voluntaria', 'Traslado', 'Otro'];

export default function AnimalForm() {
    // Lo que el usuario va escribiendo
    const [formulario, setFormulario] = useState(formularioVacio)
    // Errores por campo que devuelve el backend, ej: { edad: 'Debe ser un número entero' }
    const [errores, setErrores] = useState({})
    // Mensaje general de éxito o error
    const [mensaje, setMensaje] = useState(null)
    // true mientras se espera la respuesta del backend
    const [enviando, setEnviando] = useState(false)

    // Se ejecuta cada vez que el usuario escribe en un campo
    function cambiarCampo(event) {
        const nombreCampo = event.target.name
        const valorNuevo = event.target.value
        setFormulario({ ...formulario, [nombreCampo]: valorNuevo })
    }

    // Se ejecuta al apretar "Registrar animal"
    async function enviarFormulario(event) {
        event.preventDefault()
        setErrores({})
        setMensaje(null)
        setEnviando(true)

        // Los inputs entregan texto; el backend espera números en edad y peso
        const datos = {
            especie_animal: formulario.especie_animal,
            via_ingreso: formulario.via_ingreso,
            edad: Number(formulario.edad),
            peso_animal: Number(formulario.peso_animal),
            observaciones_animal: formulario.observaciones_animal,
        }

        try {
            const animal = await crearAnimal(datos)
            setMensaje({ tipo: 'exito', texto: `Animal registrado con el id ${animal.id_animal}` })
            setFormulario(formularioVacio)
        } catch (error) {
        if (error.details && error.details.length > 0) {
            // 400: errores de validación, uno por campo
            const erroresPorCampo = {}
            for (const detalle of error.details) {
            erroresPorCampo[detalle.campo] = detalle.mensaje
            }
            setErrores(erroresPorCampo)
            setMensaje({ tipo: 'error', texto: 'Revisa los campos marcados' })
        } else if (error.details) {
            // El backend respondió con otro error (404, 409, 500...)
            setMensaje({ tipo: 'error', texto: error.message })
        } else {
            // No hubo respuesta del backend (apagado o sin conexión)
            setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' })
        }
        } finally {
            setEnviando(false)
        }
    }
    return (
        <form className="animal-form" onSubmit={enviarFormulario}>
        <h2 className="animal-form__title">Ingreso de animal</h2>

        <label className="animal-form__field">
            Especie
            <input
            name="especie_animal"
            type="text"
            value={formulario.especie_animal}
            onChange={cambiarCampo}
            placeholder="Ej: perro, gato"
            minLength={2}
            maxLength={100}
            required
            />
            {errores.especie_animal && (
            <span className="animal-form__error">{errores.especie_animal}</span>
            )}
        </label>

        <label className="animal-form__field">
            Vía de ingreso
            <select
            name="via_ingreso"
            value={formulario.via_ingreso}
            onChange={cambiarCampo}
            required
            >
            <option value="">Selecciona una opción</option>
            {viasDeIngreso.map((via) => (
                <option value={via} key={via}>
                {via}
                </option>
            ))}
            </select>
            {errores.via_ingreso && (
            <span className="animal-form__error">{errores.via_ingreso}</span>
            )}
        </label>

        <div className="animal-form__row">
            <label className="animal-form__field">
            Edad estimada (años)
            <input
                name="edad"
                type="number"
                value={formulario.edad}
                onChange={cambiarCampo}
                min={0}
                max={40}
                step={1}
                required
            />
            {errores.edad && <span className="animal-form__error">{errores.edad}</span>}
            </label>

            <label className="animal-form__field">
            Peso (kg)
            <input
                name="peso_animal"
                type="number"
                value={formulario.peso_animal}
                onChange={cambiarCampo}
                min={0.01}
                max={150}
                step={0.01}
                required
            />
            {errores.peso_animal && (
                <span className="animal-form__error">{errores.peso_animal}</span>
            )}
            </label>
        </div>

        <label className="animal-form__field">
            Estado general y observaciones
            <textarea
            name="observaciones_animal"
            value={formulario.observaciones_animal}
            onChange={cambiarCampo}
            rows={4}
            maxLength={1000}
            placeholder="Ej: buen estado general, algo desnutrido"
            />
            {errores.observaciones_animal && (
            <span className="animal-form__error">{errores.observaciones_animal}</span>
            )}
        </label>

        {mensaje && (
            <p className={`animal-form__message animal-form__message--${mensaje.tipo}`}>
            {mensaje.texto}
            </p>
        )}

        <button className="area-action animal-form__submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Registrar animal'}
        </button>
        </form>
    )
}