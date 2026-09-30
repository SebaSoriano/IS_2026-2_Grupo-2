import React from 'react';
import './index.css';

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
      <div id="filter">
        <button>Filtrar por...</button>
      </div>
    </body>
  );
};