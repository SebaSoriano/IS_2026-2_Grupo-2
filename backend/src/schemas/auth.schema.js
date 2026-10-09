import { crearSchema, rut, texto, booleano } from './validadores.js';

// reglas del body de POST /api/auth/login
export const loginSchema = crearSchema({
    rut_usuario: {
        // para que venga con formato 12345678-9
        validar: rut, 
        // sin espacios y K mayuscula
        transformar: (valor) => valor.trim().toUpperCase()
    },
    contrasena: {
        // la contraseña debe ser un texto no vacío
        validar: (valor) => texto(valor, { min: 1, max:100 }), 
        // transformar hace que devuelva el mismo valor 
        // y que no se recorten los espacios
        transformar: (valor) => valor
    },
    recordarme: {
        // casilla de recordarme, viene por defecto true
        validar: booleano, opcional: true
    },
});