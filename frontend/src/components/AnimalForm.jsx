import { useEffect, useRef, useState } from 'react'
import { actualizarAnimal, crearAnimal } from '../services/api.js'
import './AnimalForm.css'

// Valores iniciales del formulario
const formularioVacio = {
    nombre_animal: '',
    especie_animal: '',
    via_ingreso: '',
    edad: '',
    peso_animal: '',
    observaciones_animal: '',
}

// Opciones para la vía de ingreso
const viasDeIngreso = ['Rescate', 'Abandono', 'Entrega voluntaria', 'Traslado', 'Otro']

// Convierte un animal de la base de datos en los valores del formulario
function formularioDesdeAnimal(animal) {
    return {
        nombre_animal: animal.nombre_animal,
        especie_animal: animal.especie_animal,
        via_ingreso: animal.via_ingreso,
        edad: String(animal.edad),
        peso_animal: String(animal.peso_animal),
        observaciones_animal: animal.observaciones_animal ?? '',
    }
}

export default function AnimalForm({ animal, onClose, onSaved }) {
    // Si recibe un animal significa que está modificando; si recibe null, está ingresando un animal nuevo
    const esEdicion = animal != null

    const [formulario, setFormulario] = useState(
        esEdicion ? formularioDesdeAnimal(animal) : formularioVacio,
    )
    const [errores, setErrores] = useState({})
    const [mensajeError, setMensajeError] = useState('')
    const [enviando, setEnviando] = useState(false)

    // Referencia al <dialog> para poder abrirlo
    const dialogRef = useRef(null)

    // Abrir el popup apenas aparece el componente
    useEffect(() => {
        const dialog = dialogRef.current
        if (dialog && !dialog.open) {
        dialog.showModal()
        }
    }, [])

    // Si el animal tiene una vía de ingreso que no está en la lista, se agrega como opción
    const opcionesVia =
        formulario.via_ingreso && !viasDeIngreso.includes(formulario.via_ingreso)
        ? [formulario.via_ingreso, ...viasDeIngreso]
        : viasDeIngreso

    function cambiarCampo(event) {
        const nombreCampo = event.target.name
        const valorNuevo = event.target.value
        setFormulario({ ...formulario, [nombreCampo]: valorNuevo })
    }

    function cerrar() {
        if (enviando) return
        onClose()
    }

    async function enviarFormulario(event) {
        event.preventDefault()
        setErrores({})
        setMensajeError('')
        setEnviando(true)

        // Los inputs entregan texto; el backend espera números en edad y peso
        const datos = {
            nombre_animal: formulario.nombre_animal,
            especie_animal: formulario.especie_animal,
            via_ingreso: formulario.via_ingreso,
            edad: Number(formulario.edad),
            peso_animal: Number(formulario.peso_animal),
            observaciones_animal: formulario.observaciones_animal,
        }

        try {
            let animalGuardado
        if (esEdicion) {
            animalGuardado = await actualizarAnimal(animal.id_animal, datos)
        } else {
            animalGuardado = await crearAnimal(datos)
        }
        // Avisarle a AnimalSection que se guardó (cierra el popup y actualiza la tabla)
        onSaved(animalGuardado)
        } catch (error) {
        if (error.details && error.details.length > 0) {
            // 400: errores de validación, uno por campo
            const erroresPorCampo = {}
            for (const detalle of error.details) {
            erroresPorCampo[detalle.campo] = detalle.mensaje
            }
            setErrores(erroresPorCampo)
            setMensajeError('Revisa los campos marcados')
        } else if (error.details) {
            // El backend respondió con otro error (404, 409, 500...)
            setMensajeError(error.message)
        } else {
            // No hubo respuesta del backend
            setMensajeError('No se pudo conectar con el servidor')
        }
        } finally {
            setEnviando(false)
        }
    }
// Elemento dialog con el formulario.
    return (
        <dialog
        className="animal-dialog"
        ref={dialogRef}
        aria-labelledby="animal-dialog-title"
        onCancel={(event) => { // Se cierra el popup al apretar ESC o hacer click fuera del dialog
            event.preventDefault()
            cerrar()
        }}
        >
        <form className="animal-form" onSubmit={enviarFormulario}>
            <div className="animal-dialog-header">
            <h2 id="animal-dialog-title">
                {esEdicion ? `Modificar animal ${animal.id_animal}` : 'Registrar animal'}
            </h2>
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

            {mensajeError && (
            <p className="animal-form__error" role="alert">
                {mensajeError}
            </p>
            )}
            
            <label className="animal-form__field">
            Nombre
            <input
                name="nombre_animal"
                type="text"
                value={formulario.nombre_animal}
                onChange={cambiarCampo}
                placeholder="Ej: Firulais (o 'Sin nombre')"
                maxLength={100}
                required
            />
            {errores.nombre_animal && (
                <span className="animal-form__error">{errores.nombre_animal}</span>
            )}
            </label>

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
                {opcionesVia.map((via) => (
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
                {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar animal'}
            </button>
            </div>
        </form>
        </dialog>
    )
}