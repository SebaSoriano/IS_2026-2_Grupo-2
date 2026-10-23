import { useState } from 'react'

// Valores iniciales del buscador: todos los campos vacíos significan "sin filtros"
const filtrosVacios = { animal: '', veterinario: '', desde: '', hasta: '' }

// buscador del historial médico. Guarda lo que se escribe en sus propios campos.
export default function HistorialFiltros({
  onBuscar,
  valoresIniciales = {},
  vista,
  onCambiarVista,
}) {
  // Se parte de los campos vacíos y encima se ponen los valores iniciales que lleguen
  const [filtros, setFiltros] = useState({ ...filtrosVacios, ...valoresIniciales })

  function cambiarCampo(event) {
    setFiltros({ ...filtros, [event.target.name]: event.target.value })
  }

  // preventDefault evita que el formulario recargue la página, que es lo que hace
  // el navegador por defecto al enviar un <form>
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
      className="historial-filtros"
      role="search"
      aria-label="Buscar en el historial médico"
      onSubmit={buscar}
    >
      <label className="historial-filtros__campo">
        Animal
        <input
          name="animal"
          type="search"
          value={filtros.animal}
          onChange={cambiarCampo}
          placeholder="Ej: Chocolito"
          maxLength={100}
        />
      </label>

      <label className="historial-filtros__campo">
        Veterinario
        <input
          name="veterinario"
          type="search"
          value={filtros.veterinario}
          onChange={cambiarCampo}
          placeholder="Ej: González"
          maxLength={100}
        />
      </label>

      {/* max y min impiden elegir un "desde" posterior al "hasta" en el calendario.
          Para un solo día se elige la misma fecha en los dos campos. */}
      <label className="historial-filtros__campo">
        Desde
        <input
          name="desde"
          type="date"
          value={filtros.desde}
          onChange={cambiarCampo}
          max={filtros.hasta || undefined}
        />
      </label>

      <label className="historial-filtros__campo">
        Hasta
        <input
          name="hasta"
          type="date"
          value={filtros.hasta}
          onChange={cambiarCampo}
          min={filtros.desde || undefined}
        />
      </label>

      {/* Espacio reservado: el filtro por insumo se habilita cuando la base de datos
          registre qué insumos se usaron en cada tratamiento */}
      <label className="historial-filtros__campo">
        Insumo
        <input type="search" placeholder="Pendiente" disabled />
      </label>

      <div className="historial-filtros__acciones">
        <button className="historial-filtros__buscar" type="submit">
          Buscar
        </button>
        <button
          className="historial-filtros__limpiar"
          type="button"
          onClick={limpiar}
          aria-label="Limpiar filtros"
          title="Limpiar filtros"
        >
          ×
        </button>
      </div>

      {/* Botones para cambiar de vista. aria-pressed indica cuál está activo,
          así los lectores de pantalla lo anuncian como un botón "presionado" */}
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