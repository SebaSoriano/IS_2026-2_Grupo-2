// La API responde los errores como [{ campo, mensaje }]; esto los convierte en { campo: mensaje }
export function erroresPorCampo(error) {
  return Object.fromEntries((error.details ?? []).map(({ campo, mensaje }) => [campo, mensaje]))
}

// Los campos opcionales vacíos NO se envían: un teléfono "" fallaría la validación del backend
export const sinVacios = (objeto) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== ''))

export function Campo({ etiqueta, error, ayuda, children }) {
  return (
    <label className="donation-field">
      {etiqueta}
      {children}
      {ayuda && <span className="donation-field__ayuda">{ayuda}</span>}
      {error && <span className="donation-field__error" role="alert">{error}</span>}
    </label>
  )
}

export function CamposDonante({ valores, errores, onChange }) {
  return (
    <>
      <Campo etiqueta="Nombre" error={errores.donante_nombre}>
        <input
          name="donante_nombre"
          value={valores.donante_nombre}
          onChange={onChange}
          maxLength={100}
          autoComplete="name"
          required
          aria-invalid={Boolean(errores.donante_nombre)}
        />
      </Campo>
      <Campo etiqueta="Correo electrónico" error={errores.donante_correo}>
        <input
          name="donante_correo"
          type="email"
          value={valores.donante_correo}
          onChange={onChange}
          maxLength={100}
          autoComplete="email"
          required
          aria-invalid={Boolean(errores.donante_correo)}
        />
      </Campo>
      <Campo
        etiqueta="Teléfono (opcional)"
        error={errores.donante_telefono}
        ayuda="Ejemplo: +56912345678"
      >
        <input
          name="donante_telefono"
          type="tel"
          value={valores.donante_telefono}
          onChange={onChange}
          autoComplete="tel"
          aria-invalid={Boolean(errores.donante_telefono)}
        />
      </Campo>
    </>
  )
}