import { useEffect, useState } from 'react'
import { adoptionActions } from './data/adoptionActions.js'
import { inventoryActions } from './data/inventoryActions.js'
import { sections } from './data/sections.js'
import AnimalSection from './components/AnimalSection.jsx'
import InventorySection from './components/InventorySection.jsx'
import ScheduleSection from './schedule/ScheduleSection.jsx'

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
                    onClick={
                      section.id === 'inventario' && action === 'Añadir Registro'
                        ? () => setIsInventoryCreateOpen(true)
                        : undefined
                    }
                  >
                    {action}
                  </button>
                ))}
            </div>
          )}
          {section.id === 'animales' && activeSection === 'animales' && (
            <AnimalSection />
          )}
          {section.id === 'inventario' && activeSection === 'inventario' && (
            <InventorySection
              isCreateModalOpen={isInventoryCreateOpen}
              onCloseCreateModal={() => setIsInventoryCreateOpen(false)}
            />
          )}
        </section>
      ))}
    </main>
  )
}