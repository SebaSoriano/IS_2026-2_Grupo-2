import { useEffect, useState } from 'react'
import { eliminarInsumo, getInsumos, terminarEnvase } from '../../services/api.js'
import { usePermisos } from '../../sesion/sesion.js'
import { nombreInsumo } from '../../utils/insumos.js'
import InventoryForm from './InventoryForm.jsx'
import InventoryDeleteDialog from './InventoryDeleteDialog.jsx'
import InventoryItemsTable from './InventoryItemsTable.jsx'
import InventoryMovimientos from './InventoryMovimientos.jsx'
import './InventorySection.css'

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
  const [vista, setVista] = useState('insumos')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  // "Se terminó" modifica el inventario, así que solo lo ven Admin y Veterinaria (igual que Modificar)
  const { puedeEditar } = usePermisos()
  // id del insumo cuyo "Se terminó" se está guardando (para desactivar ese botón mientras tanto)
  const [terminandoId, setTerminandoId] = useState(null)
  // cada vez que cambia este número se vuelve a crear InventoryMovimientos (por su key),
  // y al crearse pide de nuevo los movimientos: así aparece la salida recién anotada
  const [versionMovimientos, setVersionMovimientos] = useState(0)

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

  const cambiarVista = (nuevaVista) => {
    if (nuevaVista === vista) return
    setSelectedIds(new Set())
    setVista(nuevaVista)
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

  // Botón "Se terminó" de un insumo de tipo "estado": pide confirmación, avisa al backend
  // (que descuenta 1 envase y anota la salida) y reemplaza el insumo en la tabla por el actualizado.
  const marcarTerminado = async (insumo) => {
    const confirmado = window.confirm(
      `¿Se terminó un envase de "${nombreInsumo(insumo)}"?\n\nSe descontará 1 del inventario y quedará anotado como salida.`,
    )
    if (!confirmado) return

    setTerminandoId(insumo.id)
    setActionError('')
    setSuccessMessage('')
    try {
      const actualizado = await terminarEnvase(insumo.id)
      setInsumos((currentInsumos) =>
        currentInsumos.map((actual) => (actual.id === actualizado.id ? actualizado : actual)),
      )
      setVersionMovimientos((version) => version + 1)
      setSuccessMessage(
        actualizado.cantidad > 0
          ? `Envase terminado. Quedan ${actualizado.cantidad} sin abrir.`
          : 'Envase terminado. Era el último: el insumo quedó sin stock.',
      )
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setTerminandoId(null)
    }
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
          <div className="inventory-views" role="group" aria-label="Vista de inventario">
            <button
              className="inventory-view-button"
              type="button"
              aria-pressed={vista === 'insumos'}
              onClick={() => cambiarVista('insumos')}
            >
              Insumos registrados
            </button>
            <button
              className="inventory-view-button"
              type="button"
              aria-pressed={vista === 'movimientos'}
              onClick={() => cambiarVista('movimientos')}
            >
              Movimientos de inventario
            </button>
          </div>
          <div hidden={vista !== 'insumos'}>
            <InventoryItemsTable
              insumos={insumos}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              puedeEditar={puedeEditar}
              terminandoId={terminandoId}
              onMarcarTerminado={marcarTerminado}
            />
          </div>
          {vista === 'movimientos' && (
            <InventoryMovimientos key={versionMovimientos} />
          )}
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
      <InventoryDeleteDialog
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleting}
        selectedCount={selectedIds.size}
        onClose={closeDeleteDialog}
        onConfirm={deleteSelectedInsumos}
      />
    </div>
  )
}