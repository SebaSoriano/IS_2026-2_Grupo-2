import { useState } from 'react';
import './PublicPage.css';
import DonationPanels from './components/DonationPanels.jsx';
import DonationInsumosForm from './components/DonationFormInsumo.jsx';
import DonationMonetariaForm from './components/DonationFormMonetaria.jsx';
import perroImage from './assets/perro.png';
import gatoImage from './assets/cat.png';

const mascotasEjemplo = [
  { especie: 'Perro', imagen: perroImage },
  { especie: 'Gato', imagen: gatoImage },
  { especie: 'Perro', imagen: perroImage },
];

export default function PublicPage() {
  const [vistaDonar, setVistaDonar] = useState(null);
  const cerrarDonar = () => setVistaDonar(null);

  return (
    <div id="publicpage">
      <header className="navbar">
        <div className="mainlogo">
          <img src="/logo_straypaws.png" alt="Logo de Stray Paws" className="logo" />
          <h1 className="title">Huellas sin hogar</h1>
        </div>
        <div className="navbar-actions">
          <button type="button" className="btn-header btn-donar" onClick={() => setVistaDonar('opciones')}>
            DONAR
          </button>
          <button type="button" className="btn-header btn-volun">SE VOLUNTARIO</button>
          <button
            type="button"
            className="btn-header btn-intranet"
            onClick={() => window.location.assign('/login')}
          >
            Acceder a Intranet
          </button>
        </div>
      </header>

      <main className="public-pets">
        <section className="public-pets__intro" aria-labelledby="public-pets-title">
          <h2 id="public-pets-title">Descubre a tu posible nuevo compañero.</h2>
          <p>
            Ellos buscan una familia que los cuide y les brinde un hogar lleno de amor.
          </p>
          
        </section>

        <section className="pet-grid" aria-label="Espacios para las mascotas">
          {mascotasEjemplo.map((mascota, index) => (
            <article className="pet-card" key={`${mascota.especie}-${index}`}>
              <div className="pet-card__photo">
                <img
                  src={mascota.imagen}
                  alt={`Imagen de referencia para una mascota ${mascota.especie.toLowerCase()}`}
                />
                
              </div>
              <div className="pet-card__details">
                <p className="pet-card__species">{mascota.especie}</p>
                <h3>Nombre de la mascota</h3>
                <p>Edad y otros detalles aparecerán aquí.</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      {vistaDonar === 'opciones' && (
        <DonationPanels onContinuar={setVistaDonar} onClose={cerrarDonar} />
      )}
      {vistaDonar === 'insumos' && (
        <DonationInsumosForm onVolver={() => setVistaDonar('opciones')} onClose={cerrarDonar} />
      )}
      {vistaDonar === 'monetaria' && (
        <DonationMonetariaForm onVolver={() => setVistaDonar('opciones')} onClose={cerrarDonar} />
      )}
    </div>
  );
}
