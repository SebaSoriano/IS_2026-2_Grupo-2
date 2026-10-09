import { useEffect, useState } from 'react'
import { adoptionActions } from './data/adoptionActions.js'
import { inventoryActions } from './data/inventoryActions.js'
import { sections } from './data/sections.js'
import { scheduleActions } from './data/scheduleActions.js'
import AnimalForm from './components/AnimalForm.jsx'
import InventorySection from './components/InventorySection.jsx'

function getSectionFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return sections.find((section) => `/${section.id}` === normalizedPath)?.id
}

export default function InternalPage() {
  const [activeSection, setActiveSection] = useState(
    () => getSectionFromPath(window.location.pathname) ?? 'adopcion',
  )

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
          {section.id === 'animales' && <AnimalForm />}
          {section.id === 'inventario' && activeSection === 'inventario' && (
            <InventorySection />
          )}
        </section>
      ))}
    </main>
  )
}