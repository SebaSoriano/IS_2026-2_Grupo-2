import { useState } from 'react';
// imágenes decorativas
import perroImg from './assets/login/perro.webp';
import gatoImg from './assets/login/gato.webp';

// pantalla del login
export default function Auth() { 
    const [rut, setRut] = useState('');
    const [contrasena, setContrasena] = useState('');
    // casilla de recordarme está desmarcada por defecto
    const [recordarme, setRecordarme] = useState(false);

    // al apretar continuar evita que el navegador
    // recargue la página
    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
    <main className="auth-page">
      <section className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* recuadro turquesa con los campos */}
          <div className="auth-panel">
            <h1 className="auth-title">Iniciar sesión</h1>

            <label className="auth-label" htmlFor="auth-rut">
              Usuario
            </label>
            <input
              id="auth-rut"
              className="auth-input"
              type="text"
              name="rut_usuario"
              autoComplete="username"
              placeholder="12345678-9"
              value={rut}
              onChange={(event) => setRut(event.target.value)}
              required
            />

            <label className="auth-label" htmlFor="auth-contrasena">
              Contraseña
            </label>
            <input
              id="auth-contrasena"
              className="auth-input"
              type="password"
              name="contrasena"
              autoComplete="current-password"
              placeholder="************"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              required
            />

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(event) => setRecordarme(event.target.checked)}
              />
              Recordarme
            </label>
          </div>

          <button className="auth-submit" type="submit">
            Continuar
          </button>
        </form>

        {/* son solo decoración, por eso no tienen texto alternativo */}
        <img className="auth-pet auth-pet--perro" src={perroImg} alt="" />
        <img className="auth-pet auth-pet--gato" src={gatoImg} alt="" />
      </section>
    </main>
  )
}