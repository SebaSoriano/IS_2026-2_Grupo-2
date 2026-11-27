import { useEffect, useState } from 'react';
import './PublicPage.css';
import DonationPanels from './components/DonationPanels.jsx';
import DonationInsumosForm from './components/DonationFormInsumo.jsx';
import DonationMonetariaForm from './components/DonationFormMonetaria.jsx';
import Modal from './schedule/Modal.jsx';
import perroImage from './assets/perro.png';
import gatoImage from './assets/cat.png';
import { getAnimalesPublicos } from './services/api.js';
import { SEXOS_ANIMAL } from './data/estados.js';
import AnimalCarrusel from './components/animales/AnimalCarrusel.jsx';

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

function TarjetaAnimal({ animal, onVerDetalles }) {
  const foto = animal.foto_animal || fotoDeEjemplo(animal.especie_animal);

  return (
    <article className="pet-card" key={animal.id_animal}>
      <div className="pet-card__photo">
        {foto ? (
          <img src={foto} alt={`Foto de ${animal.nombre_animal}`} />
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
            onClick={() => onVerDetalles(animal)}
          >
            Ver detalles
          </button>
          <a className="pet-card__adopt-button" href={`/adoptar?animal=${animal.id_animal}`}>
            Quiero adoptar
          </a>
        </div>
      </div>
    </article>
  );
}

export default function PublicPage() {
  const [vistaDonar, setVistaDonar] = useState(null);
  const [animalDetalles, setAnimalDetalles] = useState(null);
  // Animal cuyas fotos se están mirando en el carrusel (null = carrusel cerrado)
  const [animalFotos, setAnimalFotos] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState('cargando');
  const [errorCarga, setErrorCarga] = useState('');
  const cerrarDonar = () => setVistaDonar(null);
  const fotoAnimalDetalles = animalDetalles
    ? animalDetalles.foto_animal || fotoDeEjemplo(animalDetalles.especie_animal)
    : null;
  const esGato = (animal) => animal.especie_animal.trim().toLowerCase().includes('gato');
  const esPerro = (animal) => animal.especie_animal.trim().toLowerCase().includes('perro');
  const gruposAnimales = [
    {
      key: 'gatos',
      titulo: 'Gatos',
      animales: animales.filter(esGato),
    },
    {
      key: 'perros',
      titulo: 'Perros',
      animales: animales.filter(esPerro),
    },
  ];
  const otrosAnimales = animales.filter((animal) => !esGato(animal) && !esPerro(animal));

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
          <img className="public-pets__mascot public-pets__mascot--dog" src={perroImage} alt="" aria-hidden="true" />
          <div className="public-pets__intro-copy">
            <span className="public-pets__eyebrow">ADOPTA CON EL CORAZÓN</span>
            <h2 id="public-pets-title">Descubre a tu nuevo compañero.</h2>
            <p>
              Ellos buscan una familia que los cuide y les brinde un hogar lleno de amor.
            </p>
          </div>
          <img className="public-pets__mascot public-pets__mascot--cat" src={gatoImage} alt="" aria-hidden="true" />
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
          {estadoCarga === 'listo' && animales.length > 0 && (
            <>
              <div className="pet-groups">
                {gruposAnimales.map((grupo) => (
                  <section className="pet-group" key={grupo.key} aria-labelledby={`pet-group-${grupo.key}`}>
                    <h3 id={`pet-group-${grupo.key}`}>{grupo.titulo}</h3>
                    <div className="pet-group__cards">
                      {grupo.animales.length === 0 ? (
                        <p className="pet-group__empty">No hay {grupo.titulo.toLowerCase()} disponibles por el momento.</p>
                      ) : grupo.animales.map((animal) => (
                        <TarjetaAnimal
                          animal={animal}
                          key={animal.id_animal}
                          onVerDetalles={setAnimalDetalles}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {otrosAnimales.length > 0 && (
                <section className="pet-group pet-group--other" aria-labelledby="pet-group-otros">
                  <h3 id="pet-group-otros">Otras mascotas</h3>
                  <div className="pet-group__cards">
                    {otrosAnimales.map((animal) => (
                      <TarjetaAnimal
                        animal={animal}
                        key={animal.id_animal}
                        onVerDetalles={setAnimalDetalles}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
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
              {animalDetalles.sexo_animal && (
                <div>
                  <dt>Sexo</dt>
                  <dd>{SEXOS_ANIMAL[animalDetalles.sexo_animal]}</dd>
                </div>
              )}
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
            {animalDetalles.fotos?.length > 1 && (
              <button
                className="pet-card__details-button"
                type="button"
                onClick={() => {
                  setAnimalFotos(animalDetalles);
                  setAnimalDetalles(null);
                }}
              >
                Ver todas las fotos ({animalDetalles.fotos.length})
              </button>
            )}
            <a className="pet-card__adopt-button" href={`/adoptar?animal=${animalDetalles.id_animal}`}>
              Quiero adoptar a {animalDetalles.nombre_animal}
            </a>
          </div>
        </Modal>
      )}
      {animalFotos && (
        <AnimalCarrusel
          animal={animalFotos}
          puedeEliminar={false}
          onClose={() => {
            setAnimalDetalles(animalFotos);
            setAnimalFotos(null);
          }}
        />
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
