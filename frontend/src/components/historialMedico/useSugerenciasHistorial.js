import { useEffect, useState } from 'react'
import { getAnimales, getVeterinariosHistorial } from '../../services/api.js'

// Carga una sola vez las listas que usa la búsqueda con predicción del historial médico
// (en el buscador y en la ventana de añadir y modificar) y las deja con la forma
// que espera Autocompletar.jsx: { valor, texto, detalle }.
//
// Si una lista no se puede cargar, queda vacía: el campo se sigue pudiendo escribir a mano,
// solo que sin sugerencias. Por eso los errores no se muestran aquí.
export function useSugerenciasHistorial() {
  const [animales, setAnimales] = useState([])
  const [veterinarios, setVeterinarios] = useState([])

  useEffect(() => {
    // "activo" evita guardar datos si el componente ya se cerró antes de que llegue la respuesta
    let activo = true
    getAnimales()
      .then((lista) => activo && setAnimales(lista))
      .catch(() => {})
    getVeterinariosHistorial()
      .then((lista) => activo && setVeterinarios(lista))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  return {
    // animales completos (con id, especie, etc.), para quien necesite más datos
    animales,
    // valor = id del animal, texto = nombre (lo que se busca), detalle = especie (gris a la derecha)
        opcionesAnimales: animales.map((animal) => ({
      valor: animal.id_animal,
      texto: animal.nombre_animal,
      detalle: animal.especie_animal,
    })),
    // los veterinarios son solo nombres, así que el nombre sirve como valor y como texto
    opcionesVeterinarios: veterinarios.map((nombre) => ({ valor: nombre, texto: nombre })),
  }
}