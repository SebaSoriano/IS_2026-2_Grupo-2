// Configuración de la sesión: el JWT y la cookie donde se guarda.
// Se junta todo aquí para que el login, el logout y el middleware
// usen exactamente los mismos valores (si no coinciden, el navegador
// no borra la cookie al cerrar sesión).

// La clave secreta con la que el servidor firma los tokens.
// Se lee del .env para que no quede escrita en el código ni se suba a GitHub.
// Si falta, el servidor no arranca: es mejor enterarse al tiro
// que descubrir después que nadie puede iniciar sesión.
export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el archivo .env (revisa .env.example)');
}

// Nombre de la cookie que guarda el token en el navegador
export const COOKIE_NAME = 'token';

// Cuánto dura la sesión, en milisegundos.
// Si la persona marca "Recordarme" dura 7 días; si no, 8 horas (una jornada).
const UNA_HORA = 60 * 60 * 1000;
export const DURACION_SESION = 8 * UNA_HORA;
export const DURACION_RECORDARME = 7 * 24 * UNA_HORA;

// En producción el sitio va con HTTPS, y ahí la cookie debe ser "secure".
// En desarrollo (localhost con http) se deja en false, porque el navegador
// no guardaría una cookie secure que llega por http.
const esProduccion = process.env.NODE_ENV === 'production';

// Opciones que se le pasan a res.cookie y a res.clearCookie
export const opcionesCookie = {
    // httpOnly: el JavaScript de la página no puede leer la cookie
    // (document.cookie no la muestra), así un script malicioso (XSS) no puede robar el token.
    httpOnly: true,
    // secure: la cookie solo viaja por HTTPS (solo en producción, ver arriba)
    secure: esProduccion,
    // sameSite 'lax': el navegador no manda la cookie en peticiones que otro sitio
    // dispara a escondidas (POST, fetch, formularios), lo que protege contra CSRF.
    // Sí la manda al entrar con un link normal, por eso la sesión no se pierde al abrir un enlace.
    sameSite: 'lax',
    // path '/': la cookie se manda en todas las rutas del sitio
    path: '/',
};