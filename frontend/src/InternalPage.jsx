import { useState } from 'react'

export default function InternalPage() {
  const [activeSection, setActiveSection] = useState('adopcion')
  const sections = [
    { label: 'Horario', id: 'horario' },
    { label: 'Adopción', id: 'adopcion' },
    { label: 'Historial Médico', id: 'historial-medico' },
    { label: 'Inventario', id: 'inventario' },
    { label: 'Donaciones', id: 'donaciones' },
  ]

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
            <button
              className={`nav-link${activeSection === section.id ? ' is-active' : ''}`}
              type="button"
              aria-pressed={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
              key={section.id}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

    </main>
  )
}