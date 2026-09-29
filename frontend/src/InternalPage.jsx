export default function InternalPage() {
  const sections = ['Horario', 'Adopción', 'Historial Médico', 'Inventario', 'Donaciones']

  return (
    <main>
      <header className="site-header">
        <div className="brand-row">
          <a className="brand" href="#inicio" aria-label="Stray Paws, inicio">
            <img className="brand-logo" src="/logo_straypaws.png" alt="Stray Paws" />
          </a>
        </div>
      </header>

    </main>
  )
}