import { API_BASE_URL } from './api.js'

// Todas las funciones usan credentials: 'include'.
// Eso le dice al navegador que mande (y acepte guardar) las cookies en la petición,
// incluida la cookie "token" con el JWT. El código nunca toca el token:
// el navegador lo guarda y lo manda solo, porque la cookie es httpOnly.

// Inicia sesión. Si sale bien, el backend responde con la cookie y los datos del usuario.
// recordarme viaja como booleano (true/false), que es lo que pide loginSchema
export async function login({ rut_usuario, contrasena, recordarme = false }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rut_usuario, contrasena, recordarme }),
    })

    const data = await response.json().catch(() => null);

    return { ok: response.ok, status: response.status, data };
}

// Cierra la sesión: el backend responde pidiéndole al navegador que borre la cookie
export async function logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    })
}

// Pregunta al backend quién inició sesión.
// Como el JavaScript no puede leer la cookie httpOnly, esta es la única forma
// de saber si hay una sesión activa.
// Devuelve el usuario ({ rut, nombre, correo, rol }) o null si no hay sesión.
export async function obtenerSesion() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
    })

    if (!response.ok) return null

    const data = await response.json().catch(() => null)
    return data?.data?.user ?? null
}