import { useEffect, useRef, useState } from 'react'
import { eliminarProcedimiento } from '../../services/api.js'
import { usePermisos } from '../../sesion/sesion.js'
import { useProcedimientos } from './useProcedimientos.js'
// se reutilizan los estilos del popup de animales (encabezado, botón cerrar)
import '../animales/AnimalForm.css'
import './HistorialProcedimientos.css'

// Ventana "Ver tratamientos": muestra en una tabla todos los procedimientos del catálogo.
// Admin y Veterinaria ven además un botón "Borrar" en cada fila; el Voluntario solo ve la lista,
// porque el backend no le deja borrar (DELETE responde 403 para su rol).
export default function HistorialProcedimientos({ onClose }) {
  const { puedeEditar } = usePermisos()
  const { procedimientos, estado, error, recargar } = useProcedimientos()
  // Mensaje de éxito o error dentro de la ventana
  const [mensaje, setMensaje] = useState(null)
  // id del procedimiento que se está borrando (su botón dice "Borrando..."); null = ninguno
  const [borrandoId, setBorrandoId] = useState(null)

  // Referencia al <dialog> para poder abrirlo como popup, igual que HistorialForm
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  // Antes de borrar se pregunta con window.confirm, que muestra "Aceptar" y "Cancelar".
  // Si se apreta "Cancelar", confirm devuelve false y no se borra nada.
  async function borrar(procedimiento) {
    const confirmado = window.confirm(
      `¿Estás seguro de que quieres borrar este tratamiento?\n\n${procedimiento.nombre}`,
    )
    if (!confirmado) return

    setMensaje(null)
    setBorrandoId(procedimiento.id_procedimiento)
    try {
      await eliminarProcedimiento(procedimiento.id_procedimiento)
      await recargar()
      setMensaje({ tipo: 'exito', texto: `Se borró "${procedimiento.nombre}"` })
    } catch (errorBorrar) {
      setMensaje({ tipo: 'error', texto: errorBorrar.message })
    } finally {
      setBorrandoId(null)
    }
  }

  return (
    <dialog
      className="animal-dialog historial-procedimientos"
      ref={dialogRef}
      aria-labelledby="historial-procedimientos-title"
      onCancel={(event) => {
        // ESC cierra la ventana avisándole a HistorialSection (que es quien la muestra)
        event.preventDefault()
        onClose()
      }}
    >
      {/* animal-form da el mismo espacio interior (padding) y separación que los formularios */}
      <div className="animal-form">
        <div className="animal-dialog-header">
          <h2 id="historial-procedimientos-title">Tratamientos</h2>
          <button
            className="animal-dialog-close"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="historial-procedimientos__ayuda">
          Estos son los tratamientos que se sugieren al añadir un registro médico. Borrar uno no
          cambia los registros que ya lo usan.
        </p>

        {mensaje && (
          <p className={`historial-mensaje historial-mensaje--${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </p>
        )}

        {estado === 'cargando' && <p role="status">Cargando tratamientos...</p>}
        {estado === 'error' && (
          <p className="historial-mensaje historial-mensaje--error" role="alert">
            No se pudieron cargar los tratamientos: {error}
          </p>
        )}

        {estado === 'listo' && (
          // Misma tabla que el historial médico (clases historial-tabla de HistorialSection.css)
          <div className="historial-tabla-scroll historial-procedimientos__scroll">
            <table className="historial-tabla">
              <caption>Tratamientos registrados ({procedimientos.length} en total)</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  {puedeEditar && (
                    <th scope="col" className="historial-procedimientos__columna-accion">
                      Acción
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {procedimientos.length === 0 ? (
                  <tr>
                    <td className="historial-tabla__vacia" colSpan={puedeEditar ? 2 : 1}>
                      No hay tratamientos registrados.
                    </td>
                  </tr>
                ) : (
                  procedimientos.map((procedimiento) => (
                    <tr key={procedimiento.id_procedimiento}>
                      <td>{procedimiento.nombre}</td>
                      {puedeEditar && (
                        <td className="historial-procedimientos__columna-accion">
                          <button
                            className="historial-procedimientos__borrar"
                            type="button"
                            onClick={() => borrar(procedimiento)}
                            disabled={borrandoId !== null}
                            aria-label={`Borrar ${procedimiento.nombre}`}
                          >
                            {borrandoId === procedimiento.id_procedimiento
                              ? 'Borrando...'
                              : 'Borrar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </dialog>
  )
}