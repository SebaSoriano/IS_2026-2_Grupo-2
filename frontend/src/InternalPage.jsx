import { useEffect, useState } from 'react'
import { adoptionActions } from './data/adoptionActions.js'
import { inventoryActions } from './data/inventoryActions.js'
import { sections } from './data/sections.js'
import { scheduleActions } from './data/scheduleActions.js'
import { getInsumos } from './services/api.js'

function getSectionFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return sections.find((section) => `/${section.id}` === normalizedPath)?.id
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no válida'
    : new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(date)
}

export default function InternalPage() {
  const [activeSection, setActiveSection] = useState(
    () => getSectionFromPath(window.location.pathname) ?? 'adopcion',
  )
  const [insumos, setInsumos] = useState([])
  const [inventoryStatus, setInventoryStatus] = useState('idle')
  const [inventoryError, setInventoryError] = useState('')

  useEffect(() => {
    const syncSectionWithPath = () => {
      const sectionId = getSectionFromPath(window.location.pathname)
      if (sectionId) {
        setActiveSection(sectionId)
        return
      }

      window.history.replaceState(null, '', '/adopcion')
      setActiveSection('adopcion')
    }

    syncSectionWithPath()
    window.addEventListener('popstate', syncSectionWithPath)
    return () => window.removeEventListener('popstate', syncSectionWithPath)
  }, [])

  useEffect(() => {
    if (activeSection !== 'inventario') return undefined

    let isCurrentRequest = true
    setInventoryStatus('loading')
    setInventoryError('')

    getInsumos()
      .then((data) => {
        if (!isCurrentRequest) return
        setInsumos(data)
        setInventoryStatus('success')
      })
      .catch((error) => {
        if (!isCurrentRequest) return
        setInventoryError(error.message)
        setInventoryStatus('error')
      })

    return () => {
      isCurrentRequest = false
    }
  }, [activeSection])

  const navigateToSection = (event, sectionId) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    const path = `/${sectionId}`
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
    setActiveSection(sectionId)
  }

  return (
    <main>
      <header className="site-header">
        <div className="brand-row">
          <a className="brand" href="#inicio" aria-label="Stray Paws, inicio">
            <img className="brand-logo" src="/logo_straypaws.png" alt="Stray Paws" />
            <span className="brand-title">Stray Paws</span>
          </a>
        </div>

        <nav className="section-nav" aria-label="Secciones principales">
          {sections.map((section) => (
            <a
              className={`nav-link${activeSection === section.id ? ' is-active' : ''}`}
              href={`/${section.id}`}
              aria-current={activeSection === section.id ? 'page' : undefined}
              onClick={(event) => navigateToSection(event, section.id)}
              key={section.id}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      {sections.map((section) => (
        <section
          className={`section-area section-area--${section.id}`}
          aria-label={`Área de ${section.label}`}
          hidden={activeSection !== section.id}
          key={section.id}
        >
          {(section.id === 'horario' ||
            section.id === 'inventario' ||
            section.id === 'adopcion') && (
            <div
              className={`area-actions area-actions--${section.id}`}
              role="group"
              aria-label={`Acciones de ${section.label.toLowerCase()}`}
            >
              {(section.id === 'horario'
                ? scheduleActions
                : section.id === 'inventario'
                  ? inventoryActions
                  : adoptionActions
              ).map((action) => (
                  <button className="area-action" type="button" key={action}>
                    {action}
                  </button>
                ))}
            </div>
          )}
          {section.id === 'inventario' && (
            <div
              className="inventory-table-container"
              aria-busy={inventoryStatus === 'loading'}
            >
              {inventoryStatus === 'loading' && (
                <p role="status">Cargando insumos...</p>
              )}
              {inventoryStatus === 'error' && (
                <p className="inventory-error" role="alert">
                  No se pudieron cargar los insumos: {inventoryError}
                </p>
              )}
              {inventoryStatus === 'success' && (
                <div className="inventory-table-scroll">
                  <table className="inventory-table">
                    <caption>Insumos registrados en el inventario</caption>
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Tipo de insumo</th>
                        <th scope="col">Descripción</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Fecha de ingreso</th>
                        <th scope="col">Fecha de vencimiento</th>
                        <th scope="col">Registrado por</th>
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
                        insumos.map((insumo) => (
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
            </div>
          )}
        </section>
      ))}
    </main>
  )
}