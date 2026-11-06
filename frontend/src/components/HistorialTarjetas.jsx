import fotoGato from '../assets/cat.png'
import fotoPerro from '../assets/perro.png'

// foto de ejemplo según la especie. La tabla "animales" todavía no guarda fotos
function fotoDeEjemplo(especie) {
  const especieNormalizada = especie.trim().toLowerCase()
  if (especieNormalizada === 'gato') return fotoGato
  if (especieNormalizada === 'perro') return fotoPerro
  return null
}

// la edad se guarda en años enteros, por eso un cachorro de meses tiene edad 0
function textoEdad(edad) {
  if (edad === 0) return 'Menos de 1 año'
  if (edad === 1) return '1 año'
  return `${edad} años`
}

// Vista de tarjetas: un recuadro por animal con su foto, nombre, especie y edad.
export default function HistorialTarjetas({ animales, onElegirAnimal }) {
  if (animales.length === 0) {
    return <p className="historial-tarjetas__vacia">No hay animales que coincidan con la búsqueda.</p>
  }

  return (
    <ul className="historial-tarjetas" aria-label="Animales">
      {animales.map((animal) => {
        const foto = fotoDeEjemplo(animal.especie_animal)

        return (
          <li key={animal.id_animal}>
            {/* Se usa un <button> (y no un <div> con onClick) para que la tarjeta
                también se pueda abrir con el teclado (Tab + Enter) */}
            <button
              className="historial-tarjeta"
              type="button"
              onClick={() => onElegirAnimal(animal)}
              aria-label={`Ver historial médico de ${animal.nombre_animal}`}
            >
              {foto ? (
                <img className="historial-tarjeta__foto" src={foto} alt="" />
              ) : (
                // Si la especie no es perro ni gato, se muestra la inicial del nombre
                <span className="historial-tarjeta__foto historial-tarjeta__foto--inicial" aria-hidden="true">
                  {animal.nombre_animal.charAt(0)}
                </span>
              )}
              <span className="historial-tarjeta__nombre">{animal.nombre_animal}</span>
              <span className="historial-tarjeta__dato">{animal.especie_animal}</span>
              <span className="historial-tarjeta__dato">{textoEdad(animal.edad)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}