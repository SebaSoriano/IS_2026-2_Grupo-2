import { useEffect, useRef, useState } from 'react'
import { eliminarInsumo, getInsumos } from '../services/api.js'
import InventoryForm from './InventoryForm.jsx'
import './InventorySection.css'

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
  isEditModalOpen,
  onCloseEditModal,
  isDeleteModalOpen,
  onCloseDeleteModal,
  onSelectionCountChange,
}) {
  const [insumos, setInsumos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'id', direction: 'ascending' })
  const [search, setSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const deleteDialogRef = useRef(null)

  useEffect(() => {
    onSelectionCountChange(selectedIds.size)
  }, [onSelectionCountChange, selectedIds])

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

  useEffect(() => {
    const dialog = deleteDialogRef.current
    if (!dialog) return

    if (isDeleteModalOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isDeleteModalOpen && dialog.open) {
      dialog.close()
    }
  }, [isDeleteModalOpen])

  const normalizedQuery = normalizeSearchValue(search.trim())
  const filteredInsumos = insumos.filter((insumo) => {
    if (!normalizedQuery) return true

    const searchableValues = [
      insumo.id,
      insumo.tipo_insumo,
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

  const toggleSelection = (id) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(id)) {
        nextIds.delete(id)
      } else {
        nextIds.add(id)
      }
      return nextIds
    })
  }

  const selectedInsumo =
    selectedIds.size === 1
      ? insumos.find((insumo) => selectedIds.has(insumo.id)) ?? null
      : null
  const isEditingModalOpen = isEditModalOpen && selectedInsumo != null

  const addCreatedInsumo = (insumo) => {
    setInsumos((currentInsumos) => [...currentInsumos, insumo])
    setStatus('success')
    setError('')
    setSuccessMessage('El insumo se registró correctamente.')
  }

  const updateInsumo = (insumoActualizado) => {
    setInsumos((currentInsumos) =>
      currentInsumos.map((insumo) =>
        insumo.id === insumoActualizado.id ? insumoActualizado : insumo,
      ),
    )
    setStatus('success')
    setError('')
    setSuccessMessage('El insumo se modificó correctamente.')
  }

  const closeDeleteDialog = () => {
    if (isDeleting) return
    onCloseDeleteModal()
  }

  const deleteSelectedInsumos = async () => {
    const idsToDelete = [...selectedIds]
    if (idsToDelete.length === 0 || isDeleting) return

    setIsDeleting(true)
    setActionError('')
    setSuccessMessage('')

    try {
      const results = await Promise.allSettled(
        idsToDelete.map((id) => eliminarInsumo(id)),
      )
      const deletedIds = idsToDelete.filter(
        (_, index) => results[index].status === 'fulfilled',
      )
      const failedResults = results.filter(
        (result) => result.status === 'rejected',
      )

      if (deletedIds.length > 0) {
        const deletedIdSet = new Set(deletedIds)
        setInsumos((currentInsumos) =>
          currentInsumos.filter((insumo) => !deletedIdSet.has(insumo.id)),
        )
        setSelectedIds((currentIds) =>
          new Set([...currentIds].filter((id) => !deletedIdSet.has(id))),
        )
        setSuccessMessage(
          deletedIds.length === 1
            ? 'El insumo se eliminó correctamente.'
            : `Se eliminaron ${deletedIds.length} insumos correctamente.`,
        )
      }

      if (failedResults.length > 0) {
        const errorMessages = [
          ...new Set(failedResults.map((result) => result.reason.message)),
        ]
        setActionError(
          `No se pudieron eliminar ${failedResults.length} ${
            failedResults.length === 1 ? 'insumo' : 'insumos'
          }: ${errorMessages.join(' ')}`,
        )
      }
    } finally {
      setIsDeleting(false)
      onCloseDeleteModal()
    }
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
      {actionError && (
        <p className="inventory-error" role="alert">
          {actionError}
        </p>
      )}
      {status === 'loading' && <p role="status">Cargando insumos...</p>}
      {status === 'error' && (
        <p className="inventory-error" role="alert">
          No se pudieron cargar los insumos: {error}
        </p>
      )}
      {status === 'success' && (
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
                    <td className="inventory-empty" colSpan="8">
                      No hay insumos registrados.
                    </td>
                  </tr>
                ) : sortedInsumos.length === 0 ? (
                  <tr>
                    <td className="inventory-empty" colSpan="8">
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
                          onChange={() => toggleSelection(insumo.id)}
                          aria-label={`Seleccionar insumo ${insumo.id}`}
                        />
                      </td>
                      <td>{insumo.id}</td>
                      <td>{insumo.tipo_insumo}</td>
                      <td>{insumo.descripcion || '—'}</td>
                      <td>{insumo.cantidad}</td>
                      <td>{formatDate(insumo.fecha_ingreso)}</td>
                      <td>{formatDate(insumo.fecha_vencimiento)}</td>
                      <td>{insumo.usuario?.nombre_usuario || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {(isCreateModalOpen || isEditingModalOpen) && (
        <InventoryForm
          key={
            isEditingModalOpen
              ? `edit-${selectedInsumo.id}`
              : 'create'
          }
          isOpen
          insumo={isEditingModalOpen ? selectedInsumo : null}
          onClose={isEditingModalOpen ? onCloseEditModal : onCloseCreateModal}
          onCreated={addCreatedInsumo}
          onUpdated={updateInsumo}
        />
      )}
      <dialog
        className="inventory-dialog"
        ref={deleteDialogRef}
        aria-labelledby="inventory-delete-title"
        aria-describedby="inventory-delete-description"
        onCancel={(event) => {
          event.preventDefault()
          closeDeleteDialog()
        }}
        onClose={() => {
          if (isDeleteModalOpen) onCloseDeleteModal()
        }}
      >
        <div className="inventory-form">
          <div className="inventory-dialog-header">
            <h2 id="inventory-delete-title">Eliminar registros</h2>
            <button
              className="inventory-dialog-close"
              type="button"
              aria-label="Cerrar"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              ×
            </button>
          </div>
          <p id="inventory-delete-description">
            ¿Seguro que deseas eliminar {selectedIds.size === 1
              ? 'el registro seleccionado'
              : `los ${selectedIds.size} registros seleccionados`}? Esta acción no se puede deshacer.
          </p>
          <div className="inventory-form-actions">
            <button
              className="inventory-form-cancel"
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              className="inventory-form-delete"
              type="button"
              onClick={deleteSelectedInsumos}
              disabled={isDeleting || selectedIds.size === 0}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
