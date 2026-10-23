import { useEffect, useState } from 'react'
import { adoptionActions } from './data/adoptionActions.js'
import { inventoryActions } from './data/inventoryActions.js'
import { sections } from './data/sections.js'
import AnimalSection from './components/AnimalSection.jsx'
import HistorialSection from './components/HistorialSection.jsx'
import InventorySection from './components/InventorySection.jsx'
import ScheduleSection from './schedule/ScheduleSection.jsx'
import VolunteerSection from './components/VolunteerSection.jsx'
import DonationSection from './components/DonationSection.jsx'

// cada seccion usa su path si lo tiene (ej: horario en /intranet/horario), si no /<id>
const sectionPath = (section) => section.path ?? `/${section.id}`

// tambien reconoce subrutas, ej: /intranet/horario/asistencia sigue siendo la seccion horario
function getSectionFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return sections.find((section) => {
    const path = sectionPath(section)
    return normalizedPath === path || normalizedPath.startsWith(`${path}/`)
  })?.id
}

export default function InternalPage() {
  const [activeSection, setActiveSection] = useState(
    () => getSectionFromPath(window.location.pathname) ?? 'adopcion',
  )
  const [isInventoryCreateOpen, setIsInventoryCreateOpen] = useState(false)
  const [isInventoryEditOpen, setIsInventoryEditOpen] = useState(false)
  const [isInventoryDeleteOpen, setIsInventoryDeleteOpen] = useState(false)
  const [selectedInventoryCount, setSelectedInventoryCount] = useState(0)

  useEffect(() => {
    const syncSectionWithPath = () => {
      const sectionId = getSectionFromPath(window.location.pathname)
      if (sectionId) {
        setActiveSection(sectionId)
        if (sectionId !== 'inventario') {
          setSelectedInventoryCount(0)
          setIsInventoryDeleteOpen(false)
        }
        return
      }

      window.history.replaceState(null, '', '/adopcion')
      setActiveSection('adopcion')
      setSelectedInventoryCount(0)
      setIsInventoryDeleteOpen(false)
    }

    syncSectionWithPath()
    window.addEventListener('popstate', syncSectionWithPath)
    return () => window.removeEventListener('popstate', syncSectionWithPath)
  }, [])

  const navigateToSection = (event, section) => {
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
    const path = sectionPath(section)
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
      // avisa del cambio de URL a las secciones que tienen vistas propias (ej: horario/asistencia)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    setActiveSection(section.id)
    if (section.id !== 'inventario') {
      setSelectedInventoryCount(0)
      setIsInventoryDeleteOpen(false)
    }
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
              href={sectionPath(section)}
              aria-current={activeSection === section.id ? 'page' : undefined}
              onClick={(event) => navigateToSection(event, section)}
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
          {section.id === 'horario' && activeSection === 'horario' && <ScheduleSection />}
          {(section.id === 'inventario' || section.id === 'adopcion') && (
            <div
              className={`area-actions area-actions--${section.id}`}
              role="group"
              aria-label={`Acciones de ${section.label.toLowerCase()}`}
            >
              {(section.id === 'inventario' ? inventoryActions : adoptionActions).map((action) => (
                  <button
                    className="area-action"
                    type="button"
                    key={action}
                    disabled={
                      section.id === 'inventario' &&
                      ((action === 'Modificar Registro' && selectedInventoryCount !== 1) ||
                        (action === 'Eliminar Registro' && selectedInventoryCount === 0))
                    }
                    onClick={
                      section.id !== 'inventario'
                        ? undefined
                        : action === 'Añadir Registro'
                          ? () => setIsInventoryCreateOpen(true)
                          : action === 'Modificar Registro'
                            ? () => setIsInventoryEditOpen(true)
                            : action === 'Eliminar Registro'
                              ? () => setIsInventoryDeleteOpen(true)
                            : undefined
                    }
                  >
                    {action}
                  </button>
                ))}
            </div>
          )}
          {section.id === 'historial-medico' && activeSection === 'historial-medico' && (
            <HistorialSection />
          )}
          {section.id === 'voluntarios' && activeSection === 'voluntarios' && (
            <VolunteerSection />
          )}
          {section.id === 'inventario' && activeSection === 'inventario' && (
            <InventorySection
              isCreateModalOpen={isInventoryCreateOpen}
              onCloseCreateModal={() => setIsInventoryCreateOpen(false)}
              isEditModalOpen={isInventoryEditOpen}
              onCloseEditModal={() => setIsInventoryEditOpen(false)}
              isDeleteModalOpen={isInventoryDeleteOpen}
              onCloseDeleteModal={() => setIsInventoryDeleteOpen(false)}
              onSelectionCountChange={setSelectedInventoryCount}
            />
          )}
          {section.id === 'donaciones' && activeSection === 'donaciones' && (
            <DonationSection />
          )}
        </section>
      ))}
    </main>
  )
}

