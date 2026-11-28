import { useState } from 'react'
import { textoEstadoEnvase } from '../../utils/insumos.js'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no válida'
    : new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(date)
}

function isExpired(insumo) {
  if (!insumo.fecha_vencimiento) return false

  const expirationDate = new Date(insumo.fecha_vencimiento)
  if (Number.isNaN(expirationDate.getTime())) return false

  const today = new Date()
  const todayDateString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return expirationDate.toISOString().slice(0, 10) < todayDateString
}

function getInsumoSortValue(insumo, key) {
  if (key === 'usuario') {
    return insumo.usuario?.nombre_usuario || null
  }

  const value = insumo[key]
  if (key === 'fecha_ingreso' || key === 'fecha_vencimiento') {
    if (!value) return null
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  return value ?? null
}

function normalizeSearchValue(value) {
  if (value == null) return ''

  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

function SortableHeader({ activeSort, label, onSort, sortKey }) {
  return (
    <th
      scope="col"
      aria-sort={activeSort.key === sortKey ? activeSort.direction : 'none'}
    >
      <button
        className="inventory-sort-button"
        type="button"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span className="inventory-sort-indicator" aria-hidden="true">
          {activeSort.key === sortKey
            ? activeSort.direction === 'ascending'
              ? ' ▲'
              : ' ▼'
            : ''}
        </span>
      </button>
    </th>
  )
}

export default function InventoryItemsTable({
  insumos,
  selectedIds,
  onToggleSelection,
  puedeEditar,
  terminandoId,
  onMarcarTerminado,
}) {
  const [sort, setSort] = useState({ key: 'id', direction: 'ascending' })
  const [search, setSearch] = useState('')
  const normalizedQuery = normalizeSearchValue(search.trim())

  const filteredInsumos = insumos.filter((insumo) => {
    if (!normalizedQuery) return true

    const searchableValues = [
      insumo.tipo_insumo,
      insumo.marca,
      insumo.descripcion,
      insumo.cantidad,
      insumo.fecha_ingreso,
      insumo.fecha_vencimiento,
      insumo.fecha_ingreso ? formatDate(insumo.fecha_ingreso) : null,
      insumo.fecha_vencimiento ? formatDate(insumo.fecha_vencimiento) : null,
      insumo.usuario?.nombre_usuario,
      insumo.usuario?.correo,
      insumo.usuario?.rut_usuario,
    ]

    return searchableValues.some((value) =>
      normalizeSearchValue(value).includes(normalizedQuery),
    )
  })

  const sortedInsumos = [...filteredInsumos].sort((first, second) => {
    const firstValue = getInsumoSortValue(first, sort.key)
    const secondValue = getInsumoSortValue(second, sort.key)

    if (firstValue == null || secondValue == null) {
      if (firstValue == null && secondValue == null) return 0
      return firstValue == null ? 1 : -1
    }

    const result =
      typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), 'es', {
            numeric: true,
            sensitivity: 'base',
          })

    return sort.direction === 'ascending' ? result : -result
  })

  const sortBy = (key) => {
    setSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }))
  }

  return (
    <>
      <label className="inventory-search">
        <span>Buscar insumos</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, descripción, fecha..."
        />
      </label>
      <div className="inventory-table-scroll">
        <table className="inventory-table">
          <caption>Insumos registrados en el inventario</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Seleccionar registro</span>
              </th>
              <SortableHeader
                activeSort={sort}
                label="Tipo de insumo"
                onSort={sortBy}
                sortKey="tipo_insumo"
              />
              <SortableHeader
                activeSort={sort}
                label="Marca"
                onSort={sortBy}
                sortKey="marca"
              />
              <SortableHeader
                activeSort={sort}
                label="Descripción"
                onSort={sortBy}
                sortKey="descripcion"
              />
              <SortableHeader
                activeSort={sort}
                label="Cantidad"
                onSort={sortBy}
                sortKey="cantidad"
              />
              <SortableHeader
                activeSort={sort}
                label="Fecha de ingreso"
                onSort={sortBy}
                sortKey="fecha_ingreso"
              />
              <SortableHeader
                activeSort={sort}
                label="Fecha de vencimiento"
                onSort={sortBy}
                sortKey="fecha_vencimiento"
              />
              <SortableHeader
                activeSort={sort}
                label="Registrado por"
                onSort={sortBy}
                sortKey="usuario"
              />
              <th scope="col">Envase</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr>
                <td className="inventory-empty" colSpan="9">
                  No hay insumos registrados.
                </td>
              </tr>
            ) : sortedInsumos.length === 0 ? (
              <tr>
                <td className="inventory-empty" colSpan="9">
                  No se encontraron insumos para “{search}”.
                </td>
              </tr>
            ) : (
              sortedInsumos.map((insumo) => (
                <tr
                  className={isExpired(insumo) ? 'inventory-row--expired' : ''}
                  key={insumo.id}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(insumo.id)}
                      onChange={() => onToggleSelection(insumo.id)}
                      aria-label={`Seleccionar insumo ${insumo.id}`}
                    />
                  </td>
                  <td>{insumo.tipo_insumo}</td>
                  <td>{insumo.marca || '—'}</td>
                  <td>{insumo.descripcion || '—'}</td>
                  <td>
                    {insumo.cantidad} {insumo.unidad_medida === 'kg'
                      ? 'kg'
                      : insumo.unidad_medida === 'g'
                        ? 'g'
                        : 'unidades'}
                  </td>
                  <td>{formatDate(insumo.fecha_ingreso)}</td>
                  <td>{formatDate(insumo.fecha_vencimiento)}</td>
                  <td>{insumo.usuario?.nombre_usuario || '—'}</td>
                  <td>
                    {/* solo los insumos de tipo "estado" tienen envase; los contables muestran una raya */}
                    {insumo.tipo_control === 'estado' ? (
                      <div className="inventory-envase">
                        <span className={`inventory-envase__estado inventory-envase__estado--${insumo.estado_envase}`}>
                          {textoEstadoEnvase(insumo)}
                        </span>
                        {puedeEditar && insumo.estado_envase !== 'terminado' && insumo.cantidad > 0 && (
                          <button
                            className="inventory-envase__terminar"
                            type="button"
                            onClick={() => onMarcarTerminado(insumo)}
                            disabled={terminandoId === insumo.id}
                          >
                            {terminandoId === insumo.id ? 'Guardando...' : 'Se terminó'}
                          </button>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
