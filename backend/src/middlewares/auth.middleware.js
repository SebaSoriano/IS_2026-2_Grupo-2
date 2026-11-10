import { COOKIE_NAME } from '../config/auth.js';
import { verificarToken } from '../utils/jwt.js';
import { HttpError } from './error.middleware.js';
import { ROLES_QUE_EDITAN, METODOS_DE_LECTURA } from '../config/roles.js';

// Protege una ruta: solo deja pasar a quien inició sesión.
// Lee el token de la cookie (cookie-parser ya la dejó en req.cookies),
// lo verifica y guarda los datos del usuario en req.usuario,
// para que los controladores sepan quién hizo la petición.
// Si no hay token, o es falso, o venció, responde 401 (no autenticado).
export const requireAuth = (req, res, next) => {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
        throw new HttpError(401, 'Debes iniciar sesión');
    }

    try {
        const payload = verificarToken(token);
        req.usuario = { rut: payload.rut, rol: payload.rol };
    } catch (error) {
        // se distingue el token vencido para que el mensaje sea más claro
        if (error.name === 'TokenExpiredError') {
            throw new HttpError(401, 'La sesión expiró, vuelve a iniciar sesión');
        }
        throw new HttpError(401, 'Sesión inválida, vuelve a iniciar sesión');
    }

    next();
};

// Deja pasar solo a los roles indicados, ej: requireRol('Admin', 'Veterinaria').
// Siempre va DESPUÉS de requireAuth, porque usa req.usuario.
// Si la persona inició sesión pero su rol no está en la lista, responde 403 (prohibido):
// el servidor sabe quién es, pero no tiene permiso para esto.
export const requireRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            throw new HttpError(403, 'No tienes permiso para realizar esta acción');
        }
        next();
    };
};

// Permite leer a todos, pero escribir solo a los roles que editan (Admin y Veterinaria).
// Mira el método HTTP de la petición:
// - GET, HEAD u OPTIONS solo consultan, así que pasa cualquiera que tenga sesión.
// - POST, PUT, PATCH y DELETE cambian datos, así que se revisa el rol con requireRol.
// Gracias a esto no hace falta escribir requireRol en cada ruta de cada archivo:
// se pone una vez por sección en index.routes.js.
// También va DESPUÉS de requireAuth.
const soloRolesQueEditan = requireRol(...ROLES_QUE_EDITAN);

const soloRolesQueCrean = requireRol(...ROLES_QUE_CREAN);

export const requireEdicion = (req, res, next) => {
    // leer: pasan todos los que tienen sesión
    if (METODOS_DE_LECTURA.includes(req.method)) {
        return next();
    }
    // agregar: pasan Admin, Veterinaria y Voluntario
    if (METODOS_DE_CREACION.includes(req.method)) {
        return soloRolesQueCrean(req, res, next);
    }
    // modificar o eliminar: pasan solo Admin y Veterinaria
    return soloRolesQueEditan(req, res, next);
};