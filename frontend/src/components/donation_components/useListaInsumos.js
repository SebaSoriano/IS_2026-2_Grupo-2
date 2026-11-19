import { useState } from 'react'
import { sinVacios } from './DonationFormPartes.jsx'

const MAXIMO_FILAS = 30 // el servidor no acepta más de 30 insumos por donación

// cada fila lleva un id propio para que React no confunda las filas al quitar una del medio
let contadorFilas = 0
const nuevaFila = () => ({ id: ++contadorFilas, tipo_insumo: '', cantidad: '', descripcion: '', fecha_vencimiento: '' })

// Guarda la lista de insumos recibidos y las funciones para modificarla.
// La usan el pop-up de confirmar y el de registrar una donación presencial
export function useListaInsumos() {
  const [filas, setFilas] = useState(() => [nuevaFila()])

  // copia la lista cambiando solo la fila y el campo indicados
  const cambiar = (indice, campo, valor) =>
    setFilas((actuales) => actuales.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)))

  const agregar = () =>
    setFilas((actuales) => (actuales.length < MAXIMO_FILAS ? [...actuales, nuevaFila()] : actuales))

  const quitar = (indice) => setFilas((actuales) => actuales.filter((_, i) => i !== indice))

  // Lo que espera el servidor: sin la descripción ni el vencimiento si se dejaron en blanco
  // (son opcionales) y con la cantidad como número
  const comoDatos = () =>
    filas.map((fila) => ({
      ...sinVacios({
        tipo_insumo: fila.tipo_insumo,
        descripcion: fila.descripcion,
        fecha_vencimiento: fila.fecha_vencimiento,
      }),
      cantidad: Number(fila.cantidad),
    }))

  return { filas, cambiar, agregar, quitar, comoDatos, estaLlena: filas.length >= MAXIMO_FILAS }
}