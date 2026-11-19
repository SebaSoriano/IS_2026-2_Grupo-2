import { useState } from 'react'
import Autocompletar from './Autocompletar.jsx'
import CampoFecha from '../fecha/CampoFecha.jsx'
import { useSugerenciasHistorial } from './useSugerenciasHistorial.js'

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
  // Cada vez que se limpian los filtros este número sube y los campos de fecha se crean de nuevo
  const [versionFechas, setVersionFechas] = useState(0)

  // Listas para la búsqueda con predicción de los campos Animal y Veterinario
  const { opcionesAnimales, opcionesVeterinarios } = useSugerenciasHistorial()

  // Cambia un solo campo del buscador sin tocar los demás (lo usan los Autocompletar)
  function cambiarValor(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor })
  }

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
    setVersionFechas(versionFechas + 1)
    onBuscar(filtrosVacios)
  }

  return (
    <form
      className="historial-filtros"
      role="search"
      aria-label="Buscar en el historial médico"
      onSubmit={buscar}
    >
      {/* Animal y Veterinario sugieren nombres mientras se escribe (ver Autocompletar.jsx).
          Igual se puede buscar un texto que no esté en la lista: el backend busca
          ese texto en cualquier parte del nombre. */}
      <label className="historial-filtros__campo">
        Animal
        <Autocompletar
          name="animal"
          opciones={opcionesAnimales}
          texto={filtros.animal}
          onCambiarTexto={(texto) => cambiarValor('animal', texto)}
          onElegir={(opcion) => cambiarValor('animal', opcion.texto)}
          placeholder="Ej: Chocolito"
          maxLength={100}
        />
      </label>

      <label className="historial-filtros__campo">
        Veterinario
        <Autocompletar
          name="veterinario"
          opciones={opcionesVeterinarios}
          texto={filtros.veterinario}
          onCambiarTexto={(texto) => cambiarValor('veterinario', texto)}
          onElegir={(opcion) => cambiarValor('veterinario', opcion.texto)}
          placeholder="Ej: González"
          maxLength={100}
        />
      </label>

      {/* Las fechas se escriben como DD-MM-AAAA (ver CampoFecha.jsx).
          max y min impiden elegir un "desde" posterior al "hasta".
          Para un solo día se elige la misma fecha en los dos campos.
          La "key" cambia al limpiar los filtros, así los campos de fecha se vacían
          aunque tuvieran una fecha escrita a medias. */}
      <label className="historial-filtros__campo">
        Desde
        <CampoFecha
          key={`desde-${versionFechas}`}
          name="desde"
          value={filtros.desde}
          onChange={cambiarCampo}
          max={filtros.hasta || undefined}
        />
      </label>

      <label className="historial-filtros__campo">
        Hasta
        <CampoFecha
          key={`hasta-${versionFechas}`}
          name="hasta"
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
                <button className="historial-filtros__limpiar" type="button" onClick={limpiar}>
          Limpiar filtros
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