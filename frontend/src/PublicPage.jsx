import React, { useState } from 'react';
import './PublicPage.css';
import DonationPanels from './components/DonationPanels.jsx';
import DonationInsumosForm from './components/DonationFormInsumo.jsx';
import DonationMonetariaForm from './components/DonationFormMonetaria.jsx';

export default function PublicPage (){
  const [vistaDonar, setVistaDonar] = useState(null);
  const cerrarDonar = () => setVistaDonar(null);
  const [filtro, setFiltro] = useState('todos');
  return (
    <div id="publicpage">
      <header className="navbar">
        <div className="mainlogo">
          <img src="./logo_straypaws.png" alt="Logo" class="logo" />
          <h1 className="title">Huellas sin hogar</h1>
        </div>
        <div className="navbar-actions">
          <button className="btn-header btn-donar" onClick={() => setVistaDonar('opciones')}>DONAR</button>
          <button className="btn-header btn-volun">SE VOLUNTARIO</button>
          <button
            className="btn-header btn-intranet"
            onClick={() => window.location.assign('/login')}
          >
            Acceder a Intranet
          </button>
        </div>
      </header>
      <div className="filter-container">
        <select 
          className="filter-select"
          onChange={(e) => onFilterChange(e.target.value)}
          defaultValue="">
        <FilterBar onFilterChange={setFiltro} />
          <option value="" disabled hidden>
            Filtrar por...
          </option>
          <option value="todos">Todos</option>
          <option value="macho">Género: Macho</option>
          <option value="hembra">Género: Hembra</option>
          <option value="pequeno">Tamaño: Pequeño</option>
          <option value="mediano">Tamaño: Mediano</option>
          <option value="grande">Tamaño: Grande</option>
        </select>
      </div>
      {vistaDonar === 'opciones' && (
        <DonationPanels onContinuar={setVistaDonar} onClose={cerrarDonar} />
      )}
      {vistaDonar === 'insumos' && (<DonationInsumosForm onVolver={() => setVistaDonar('opciones')} onClose={cerrarDonar} />)}
      {vistaDonar === 'monetaria' && (<DonationMonetariaForm onVolver={() => setVistaDonar('opciones')} onClose={cerrarDonar} />)}
    </div>
  );
}

export const Navbar = () => {
  return (
    <div id="publicpage">
      <header className="navbar">
        <div className="mainlogo">
          <img src="frontend/public/logo_straypaws.png" alt="Logo" class="logo" />
          <h1 className="title">Huellas sin hogar</h1>
        </div>
        <div className="navbar-actions">
          <button className="btn-header btn-donar">DONAR</button>
          <button className="btn-header btn-volun">SE VOLUNTARIO</button>
          <button className="btn-header btn-intranet">Acceder a Intranet</button>
        </div>
      </header>
    </div>
  );
};

export const FilterBar = ({ onFilterChange }) => {
  return (
    <div className="filter-container">
      <select 
        className="filter-select"
        onChange={(e) => onFilterChange(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled hidden>
          Filtrar por...
        </option>
        <option value="todos">Todos</option>
        <option value="macho">Género: Macho</option>
        <option value="hembra">Género: Hembra</option>
        <option value="pequeno">Tamaño: Pequeño</option>
        <option value="mediano">Tamaño: Mediano</option>
        <option value="grande">Tamaño: Grande</option>
      </select>
    </div>
  );
};