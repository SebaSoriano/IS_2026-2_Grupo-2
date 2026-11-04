import { COOKIE_NAME } from '../config/auth.js';
import { verificarToken } from '../utils/jwt.js';
import { HttpError } from './error.middleware.js';

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