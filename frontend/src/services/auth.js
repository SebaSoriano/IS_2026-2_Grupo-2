import { API_BASE_URL } from './api.js'

export async function login({rut_usuario, contrasena}) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rut_usuario, contrasena }),
    })

    const data = await response.json().catch(() => null);

    return { ok: response.ok, status: response.status, data };
}