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
    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
        // el rut se manda limpio y con el formato correcto; la contraseña se manda tal cual
            const { ok, status } = await login({
                rut_usuario: limpiarRut(rut),
                contrasena,
            })
            if (ok) {
                // login correcto: se entra a la intranet
                // no se desbloquea el botón porque la página se va a cambiar
                window.location.assign('/adopcion')
                return
            }
            // el backend rechazó el login: se muestra el motivo
            setError(getErrorMessage(status))
        } catch {
            // fetch solo falla cuando no hay conexión con el servidor
            setError('No se pudo conectar con el servidor')
        }
        setLoading(false)
    }

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

            {/* aquí se muestra el error; role alert hace que el lector de pantalla lo anuncie solo */}
            {/* el párrafo siempre existe para reservar su espacio y que el formulario no se mueva */}
            <p className="auth-error" role="alert">
              {error}
            </p>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Continuar'}
          </button>
        </form>

        <img className="auth-pet auth-pet--perro" src={perroImg} alt="" />
        <img className="auth-pet auth-pet--gato" src={gatoImg} alt="" />
      </section>
    </main>
  )
}