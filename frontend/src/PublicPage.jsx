import React from 'react';
import './PublicPage.css';

export default function PublicPage (){
  return (
    <body id="publicpage">
      <header class="navbar">
        <div class="mainlogo">
          <img src="./logo_straypaws.png" alt="Logo" class="logo" />
          <h1 class="title">Huellas sin hogar</h1>
        </div>
        <div class="navbar-actions">
          <button class="btn-header btn-donar">DONAR</button>
          <button class="btn-header btn-volun">SE VOLUNTARIO</button>
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
    </body>
  );
}

export const Navbar = () => {
  return (
    <body id="publicpage">
      <header class="navbar">
        <div class="mainlogo">
          <img src="frontend/public/logo_straypaws.png" alt="Logo" class="logo" />
          <h1 class="title">Huellas sin hogar</h1>
        </div>
        <div class="navbar-actions">
          <button class="btn-header btn-donar">DONAR</button>
          <button class="btn-header btn-volun">SE VOLUNTARIO</button>
          <button class="btn-header btn-intranet">Acceder a Intranet</button>
        </div>
      </header>
    </body>
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