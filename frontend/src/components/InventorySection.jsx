import { useEffect, useState } from 'react'
import { getInsumos } from '../services/api.js'
import InventoryForm from './InventoryForm.jsx'
import './InventorySection.css'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no válida'
    : new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(date)
}

function getInsumoSortValue(insumo, key) {
  if (key === 'usuario') {
    return insumo.usuario?.correo || insumo.usuario?.rut_usuario || null
  }

  const value = insumo[key]
  if (key === 'fecha_ingreso' || key === 'fecha_vencimiento') {
    if (!value) return null
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  return value ?? null
}

function SortableHeader({ activeSort, label, onSort, sortKey }) {
  return (
    <th
      scope="col"
      aria-sort={
        activeSort.key === sortKey ? activeSort.direction : 'none'
      }
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

export default function InventorySection({
  isCreateModalOpen,
  onCloseCreateModal,
}) {
  const [insumos, setInsumos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'id', direction: 'ascending' })
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    getInsumos()
      .then((data) => {
        if (!isCurrentRequest) return
        setInsumos(data)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return
        setError(requestError.message)
        setStatus('error')
      })

    return () => {
      isCurrentRequest = false
    }
  }, [])

  const sortedInsumos = [...insumos].sort((first, second) => {
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

  const addCreatedInsumo = (insumo) => {
    setInsumos((currentInsumos) => [...currentInsumos, insumo])
    setStatus('success')
    setError('')
    setSuccessMessage('El insumo se registró correctamente.')
  }

  return (
    <div
      className="inventory-table-container"
      aria-busy={status === 'loading'}
    >
      {successMessage && (
        <p className="inventory-success" role="status">
          {successMessage}
        </p>
      )}
      {status === 'loading' && <p role="status">Cargando insumos...</p>}
      {status === 'error' && (
        <p className="inventory-error" role="alert">
          No se pudieron cargar los insumos: {error}
        </p>
      )}
      {status === 'success' && (
        <div className="inventory-table-scroll">
          <table className="inventory-table">
            <caption>Insumos registrados en el inventario</caption>
            <thead>
              <tr>
                <SortableHeader
                  activeSort={sort}
                  label="ID"
                  onSort={sortBy}
                  sortKey="id"
                />
                <SortableHeader
                  activeSort={sort}
                  label="Tipo de insumo"
                  onSort={sortBy}
                  sortKey="tipo_insumo"
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
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td className="inventory-empty" colSpan="7">
                    No hay insumos registrados.
                  </td>
                </tr>
              ) : (
                sortedInsumos.map((insumo) => (
                  <tr key={insumo.id}>
                    <td>{insumo.id}</td>
                    <td>{insumo.tipo_insumo}</td>
                    <td>{insumo.descripcion || '—'}</td>
                    <td>{insumo.cantidad}</td>
                    <td>{formatDate(insumo.fecha_ingreso)}</td>
                    <td>{formatDate(insumo.fecha_vencimiento)}</td>
                    <td>
                      {insumo.usuario?.correo ||
                        insumo.usuario?.rut_usuario ||
                        '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <InventoryForm
        isOpen={isCreateModalOpen}
        onClose={onCloseCreateModal}
        onCreated={addCreatedInsumo}
      />
    </div>
  )
}
