import { useEffect, useState } from 'react';
import './PublicPage.css';
import DonationPanels from './components/donation_components/DonationPanels.jsx';
import DonationInsumosForm from './components/donation_components/DonationFormInsumo.jsx';
import DonationMonetariaForm from './components/donation_components/DonationFormMonetaria.jsx';
import Modal from './schedule/Modal.jsx';
import perroImage from './assets/perro.png';
import gatoImage from './assets/cat.png';
import { getAnimalesPublicos } from './services/api.js';

function fotoDeEjemplo(especie) {
  const especieNormalizada = especie.trim().toLowerCase();
  if (especieNormalizada.includes('perro')) return perroImage;
  if (especieNormalizada.includes('gato')) return gatoImage;
  return null;
}

function textoEdad(edad) {
  if (edad === 0) return 'Menos de 1 año';
  if (edad === 1) return '1 año';
  return `${edad} años`;
}

export default function PublicPage() {
  const [vistaDonar, setVistaDonar] = useState(null);
  const [animalDetalles, setAnimalDetalles] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState('cargando');
  const [errorCarga, setErrorCarga] = useState('');
  const cerrarDonar = () => setVistaDonar(null);
  const fotoAnimalDetalles = animalDetalles
    ? animalDetalles.foto_animal || fotoDeEjemplo(animalDetalles.especie_animal)
    : null;

  useEffect(() => {
    let cancelado = false;

    async function cargarAnimales() {
      try {
        const lista = await getAnimalesPublicos();
        if (cancelado) return;

        setAnimales(lista);
        setEstadoCarga('listo');
      } catch (error) {
        if (cancelado) return;

        setErrorCarga(
          error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        );
        setEstadoCarga('error');
      }
    }

    cargarAnimales();
    return () => {
      cancelado = true;
    };
  }, []);

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

        <section className="pet-grid" aria-label="Mascotas disponibles para adopción">
          {estadoCarga === 'cargando' && (
            <p className="pet-grid__message" role="status">Cargando mascotas...</p>
          )}
          {estadoCarga === 'error' && (
            <p className="pet-grid__message pet-grid__message--error" role="alert">
              No se pudieron cargar las mascotas: {errorCarga}
            </p>
          )}
          {estadoCarga === 'listo' && animales.length === 0 && (
            <p className="pet-grid__message">
              Por el momento no hay mascotas disponibles para adopción.
            </p>
          )}
          {estadoCarga === 'listo' && animales.map((animal) => {
            const foto = animal.foto_animal || fotoDeEjemplo(animal.especie_animal);

            return (
              <article className="pet-card" key={animal.id_animal}>
                <div className="pet-card__photo">
                  {foto ? (
                    <>
                      <img src={foto} alt={`Foto de ${animal.nombre_animal}`} />
                    </>
                  ) : (
                    <span className="pet-card__photo-placeholder">Foto no disponible</span>
                  )}
                </div>
                <div className="pet-card__details">
                                    <h3>{animal.nombre_animal}</h3>
                  <div className="pet-card__actions">
                    <button
                      className="pet-card__details-button"
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setAnimalDetalles(animal)}
                    >
                      Ver detalles
                    </button>
                    {/* Lleva al formulario de adopción con este animal ya elegido */}
                    <a className="pet-card__adopt-button" href={`/adoptar?animal=${animal.id_animal}`}>
                      Quiero adoptar
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {animalDetalles && (
        <Modal
          title={`Conoce a ${animalDetalles.nombre_animal}`}
          onClose={() => setAnimalDetalles(null)}
          className="public-pet-modal"
        >
          <div className="public-pet-details">
            {fotoAnimalDetalles ? (
              <img
                className="public-pet-details__photo"
                src={fotoAnimalDetalles}
                alt={`Foto de ${animalDetalles.nombre_animal}`}
              />
            ) : (
              <div className="public-pet-details__photo-placeholder">
                Foto no disponible
              </div>
            )}
            <dl className="public-pet-details__facts">
              <div>
                <dt>Especie</dt>
                <dd>{animalDetalles.especie_animal}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{textoEdad(animalDetalles.edad)}</dd>
              </div>
              <div>
                <dt>Peso</dt>
                <dd>
                  {animalDetalles.peso_animal.toLocaleString('es-CL', {
                    maximumFractionDigits: 2,
                  })} kg
                </dd>
              </div>
            </dl>
          </div>
          <div className="modal__actions">
            <a className="pet-card__adopt-button" href={`/adoptar?animal=${animalDetalles.id_animal}`}>
              Quiero adoptar a {animalDetalles.nombre_animal}
            </a>
          </div>
        </Modal>
      )}

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
