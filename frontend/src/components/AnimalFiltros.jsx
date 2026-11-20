import { useState } from 'react'
import { VIAS_DE_INGRESO } from '../data/viasIngreso.js'

// Valores iniciales: todos vacíos significa "sin filtros"
const filtrosVacios = {
  nombre: '',
  especie: '',
  via_ingreso: '',
  adoptado: '',
  edad_min: '',
  edad_max: '',
}

// Barra de filtros de la sección Animales (basada en HistorialFiltros).
// Guarda lo que se escribe en sus propios campos y solo avisa a AnimalSection al apretar "Buscar".
export default function AnimalFiltros({ onBuscar, vista, onCambiarVista }) {
  const [filtros, setFiltros] = useState(filtrosVacios)

  function cambiarCampo(event) {
    setFiltros({ ...filtros, [event.target.name]: event.target.value })
  }

  // preventDefault evita que el <form> recargue la página
  function buscar(event) {
    event.preventDefault()
    onBuscar(filtros)
  }

  // Se vacían los campos y se vuelve a pedir la lista sin filtros
  function limpiar() {
    setFiltros(filtrosVacios)
    onBuscar(filtrosVacios)
  }

  return (
    <form
      className="historial-filtros animal-filtros"
      role="search"
      aria-label="Filtrar animales"
      onSubmit={buscar}
    >
      <label className="historial-filtros__campo">
        Nombre
        <input
          name="nombre"
          type="search"
          value={filtros.nombre}
          onChange={cambiarCampo}
          placeholder="Ej: Firulais"
          maxLength={100}
        />
      </label>

      <label className="historial-filtros__campo">
        Especie
        <input
          name="especie"
          type="search"
          value={filtros.especie}
          onChange={cambiarCampo}
          placeholder="Ej: perro"
          maxLength={100}
        />
      </label>

      <label className="historial-filtros__campo">
        Vía de ingreso
        <select name="via_ingreso" value={filtros.via_ingreso} onChange={cambiarCampo}>
          <option value="">Todas</option>
          {VIAS_DE_INGRESO.map((via) => (
            <option value={via} key={via}>
              {via}
            </option>
          ))}
        </select>
      </label>

      {/* El backend espera adoptado=true o adoptado=false; '' significa "no filtrar" */}
      <label className="historial-filtros__campo">
        Estado
        <select name="adoptado" value={filtros.adoptado} onChange={cambiarCampo}>
          <option value="">Todos</option>
          <option value="false">Disponibles</option>
          <option value="true">Adoptados</option>
        </select>
      </label>

      {/* min y max hacen que el navegador no deje buscar con una edad mínima mayor que la máxima */}
      <label className="historial-filtros__campo">
        Edad desde
        <input
          name="edad_min"
          type="number"
          value={filtros.edad_min}
          onChange={cambiarCampo}
          min={0}
          max={filtros.edad_max || 40}
        />
      </label>

      <label className="historial-filtros__campo">
        Edad hasta
        <input
          name="edad_max"
          type="number"
          value={filtros.edad_max}
          onChange={cambiarCampo}
          min={filtros.edad_min || 0}
          max={40}
        />
      </label>

      <div className="historial-filtros__acciones">
        <button className="historial-filtros__buscar" type="submit">
          Buscar
        </button>
        <button className="historial-filtros__limpiar" type="button" onClick={limpiar}>
          Limpiar filtros
        </button>
      </div>

      {/* Botones para cambiar de vista (antes estaban en AnimalSection) */}
      <div className="historial-filtros__vistas" role="group" aria-label="Tipo de vista">
        <button
          className="historial-filtros__vista"
          type="button"
          aria-pressed={vista === 'tabla'}
          onClick={() => onCambiarVista('tabla')}
        >
          ☰ Tabla
        </button>
        <button
          className="historial-filtros__vista"
          type="button"
          aria-pressed={vista === 'tarjetas'}
          onClick={() => onCambiarVista('tarjetas')}
        >
          ▦ Tarjetas
        </button>
      </div>
    </form>
  )
}