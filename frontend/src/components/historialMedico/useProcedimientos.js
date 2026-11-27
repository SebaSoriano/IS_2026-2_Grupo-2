import { useCallback, useEffect, useState } from 'react'
import { getProcedimientos } from '../../services/api.js'

// Carga el catálogo de procedimientos médicos (GET /api/procedimientos).
// Lo usan el formulario del historial (para sugerir el tipo de tratamiento)
// y la ventana "Ver tratamientos" (para mostrar la tabla con el botón Borrar).
export function useProcedimientos() {
  const [procedimientos, setProcedimientos] = useState([])
  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState('')

  // Pide la lista al backend y la guarda. Se usa después de agregar o borrar un procedimiento.
  // Devuelve una promesa, así quien la llama puede esperar (await) a que la lista esté al día.
  const recargar = useCallback(
    () =>
      getProcedimientos()
        .then((lista) => {
          setProcedimientos(lista)
          setEstado('listo')
        })
        .catch((errorCarga) => {
          setError(errorCarga.message)
          setEstado('error')
        }),
    [],
  )

  // Se pide la lista una sola vez, cuando aparece el componente que usa este hook.
  // Los setState quedan dentro del .then (cuando llega la respuesta) y no directo en el efecto.
  // useCallback hace que "recargar" sea siempre la misma función, así este efecto no se repite.
  useEffect(() => {
    recargar()
  }, [recargar])

  return { procedimientos, estado, error, recargar }
}