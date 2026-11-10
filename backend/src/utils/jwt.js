import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.js';

// Crea el token de un usuario que acaba de iniciar sesión.
// Dentro del token (el "payload") se guarda solo lo necesario para saber
// quién es y qué puede hacer: el rut y el nombre del rol. Nunca la contraseña,
// porque el payload se puede leer (está en base64, no cifrado); la firma solo
// asegura que nadie lo modificó.
// duracionMs dice cuánto vale el token antes de vencer.
export const firmarToken = (usuario, duracionMs) => {
    const payload = {
        rut: usuario.rut_usuario,
        rol: usuario.rol.nombre,
    };

    // expiresIn se pasa en segundos; jwt agrega el campo "exp" al token
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: Math.floor(duracionMs / 1000),
    });
};

// Revisa que el token tenga una firma válida y que no esté vencido.
// Si está bien, devuelve el payload ({ rut, rol, iat, exp }).
// Si no, jwt.verify lanza un error (TokenExpiredError o JsonWebTokenError).
export const verificarToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};