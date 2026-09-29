export default function InternalPage() {
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
          {sections.map((section, index) => (
            <a
              className={`nav-link${index === 1 ? ' is-active' : ''}`}
              href={`#${section.id}`}
              aria-current={index === 0 ? 'page' : undefined}
              key={section.id}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

    </main>
  )
}